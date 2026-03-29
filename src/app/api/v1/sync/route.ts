import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const entryId = req.cookies.get('fpl_entry_id')?.value;
    if (!entryId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // --- Step 1: Fetch bootstrap-static (gameweeks + players) ---
    const bootstrapRes = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    if (!bootstrapRes.ok) throw new Error('Failed to fetch bootstrap data');
    const bootstrap = await bootstrapRes.json();

    // Upsert all 38 gameweeks
    const gameweeks = bootstrap.events.map((gw: any) => ({
      id: gw.id,
      deadline_time: gw.deadline_time,
      is_current: gw.is_current,
      is_next: gw.is_next,
    }));
    await supabase.from('gameweeks').upsert(gameweeks, { onConflict: 'id' });

    // Upsert all Premier League players
    const players = bootstrap.elements.map((p: any) => ({
      id: p.id,
      web_name: p.web_name,
      position: ['GKP', 'DEF', 'MID', 'FWD'][p.element_type - 1],
      current_price: p.now_cost / 10,
      status: p.status === 'a' ? 'Available'
        : p.status === 'i' ? 'Injured'
        : p.status === 's' ? 'Suspended'
        : 'Unavailable',
    }));
    await supabase.from('players').upsert(players, { onConflict: 'id' });

    // --- Step 2: Get user's internal DB id ---
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('fpl_entry_id', parseInt(entryId))
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }
    const userId = userData.id;

    // --- Step 3: Fetch squad history ---
    const historyRes = await fetch(`https://fantasy.premierleague.com/api/entry/${entryId}/history/`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (!historyRes.ok) throw new Error('Failed to fetch squad history');
    const history = await historyRes.json();

    // Upsert each gameweek's squad record
    for (const gw of history.current) {
      const { data: squadData } = await supabase
        .from('squads')
        .upsert({
          user_id: userId,
          gameweek_id: gw.event,
          bank_balance: gw.bank / 10,
        }, { onConflict: 'user_id,gameweek_id' })
        .select('id')
        .single();

      if (!squadData) continue;

      // Fetch the actual 15-player picks for that gameweek
      const picksRes = await fetch(`https://fantasy.premierleague.com/api/entry/${entryId}/event/${gw.event}/picks/`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      if (!picksRes.ok) continue;
      const picksData = await picksRes.json();

      const squadPlayers = picksData.picks.map((pick: any) => ({
        squad_id: squadData.id,
        player_id: pick.element,
        multiplier: pick.multiplier,
        is_vice_captain: pick.is_vice_captain,
        pitch_position: pick.position,
      }));

      await supabase
        .from('squad_players')
        .upsert(squadPlayers, { onConflict: 'squad_id,player_id' });
    }

    return NextResponse.json({ success: true, message: `Synced ${history.current.length} gameweeks to Supabase.` });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Sync Error:', message);
    return NextResponse.json({ error: 'Sync failed', details: message }, { status: 500 });
  }
}
