import { NextRequest } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const entryId = req.cookies.get('fpl_entry_id')?.value;
  const fromParam = req.nextUrl.searchParams.get('from');
  const resumeFrom = fromParam ? parseInt(fromParam) : 0;
  
  if (!entryId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // --- Step 1: Bootstrap (gameweeks + players) ---
        send({ step: 'bootstrap', message: 'Fetching FPL bootstrap data...' });

        const bootstrapRes = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/', {
          headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        if (!bootstrapRes.ok) throw new Error('Failed to fetch bootstrap data');
        const bootstrap = await bootstrapRes.json();

        // Upsert gameweeks
        const gameweeks = bootstrap.events.map((gw: any) => ({
          id: gw.id,
          deadline_time: gw.deadline_time,
          is_current: gw.is_current,
          is_next: gw.is_next,
        }));
        await supabase.from('gameweeks').upsert(gameweeks, { onConflict: 'id' });
        send({ step: 'gameweeks', message: `Synced ${gameweeks.length} gameweeks`, done: gameweeks.length });

        // Upsert players
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
        send({ step: 'players', message: `Synced ${players.length} players`, done: players.length });

        // --- Step 2: Ensure user exists in DB ---
        await supabase.from('users').upsert(
          { fpl_entry_id: parseInt(entryId), team_name: 'Unknown' },
          { onConflict: 'fpl_entry_id' }
        );
        const { data: userData } = await supabase
          .from('users').select('id').eq('fpl_entry_id', parseInt(entryId)).single();
        if (!userData) throw new Error('User not found in database');
        const userId = userData.id;

        // --- Step 3: Squad history picks ---
        const historyRes = await fetch(`https://fantasy.premierleague.com/api/entry/${entryId}/history/`, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        if (!historyRes.ok) throw new Error('Failed to fetch squad history');
        const history = await historyRes.json();
        const totalGWs = history.current.length;

        send({ step: 'picks_start', message: `Syncing ${totalGWs} gameweek squads...`, total: totalGWs, done: resumeFrom });

        for (let i = resumeFrom; i < totalGWs; i++) {
          const gw = history.current[i];

          const { data: squadData } = await supabase
            .from('squads')
            .upsert({
              user_id: userId,
              gameweek_id: gw.event,
              bank_balance: gw.bank / 10,
            }, { onConflict: 'user_id,gameweek_id' })
            .select('id')
            .single();

          if (squadData) {
            const picksRes = await fetch(`https://fantasy.premierleague.com/api/entry/${entryId}/event/${gw.event}/picks/`, {
              headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            if (picksRes.ok) {
              const picksData = await picksRes.json();
              const squadPlayers = picksData.picks.map((pick: any) => ({
                squad_id: squadData.id,
                player_id: pick.element,
                multiplier: pick.multiplier,
                is_vice_captain: pick.is_vice_captain,
                pitch_position: pick.position,
              }));
              await supabase.from('squad_players').upsert(squadPlayers, { onConflict: 'squad_id,player_id' });
            }
          }

          // Stream progress every GW
          send({ step: 'picks', message: `Synced GW ${gw.event} picks`, done: i + 1, total: totalGWs });
        }

        send({ step: 'complete', message: `Sync complete! ${totalGWs} gameweeks synced.` });

      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        send({ step: 'error', message });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
