import { NextRequest } from 'next/server';
import { FplApiError, getBootstrap, getEntryHistory, getPicks } from '@/lib/fpl/client';
import { resolveGameweekContext } from '@/lib/fpl/gameweekContext';
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

        const bootstrap = await getBootstrap();
        const context = resolveGameweekContext(bootstrap.events);
        const { data: season, error: seasonError } = await supabase
          .from('seasons').select('id').eq('code', context.seasonCode).single();
        if (seasonError || !season) throw new Error(`Season ${context.seasonCode} is not prepared in Supabase.`);

        // Upsert gameweeks
        const gameweeks = bootstrap.events.map((gw: any) => ({
          season_id: season.id,
          id: gw.id,
          deadline_time: gw.deadline_time,
          is_current: gw.is_current,
          is_next: gw.is_next,
        }));
        await supabase.from('gameweeks').upsert(gameweeks, { onConflict: 'season_id,id' });
        send({ step: 'gameweeks', message: `Synced ${gameweeks.length} gameweeks`, done: gameweeks.length });

        // Upsert players
        const players = bootstrap.elements.map((p: any) => ({
          season_id: season.id,
          id: p.id,
          web_name: p.web_name,
          position: ['GKP', 'DEF', 'MID', 'FWD'][p.element_type - 1],
          current_price: p.now_cost / 10,
          status: p.status === 'a' ? 'Available'
            : p.status === 'i' ? 'Injured'
            : p.status === 's' ? 'Suspended'
            : 'Unavailable',
        }));
        await supabase.from('players').upsert(players, { onConflict: 'season_id,id' });
        send({ step: 'players', message: `Synced ${players.length} players`, done: players.length });

        // --- Step 2: Ensure user exists in DB ---
        await supabase.from('users').upsert(
          { season_id: season.id, fpl_entry_id: parseInt(entryId), team_name: 'Unknown' },
          { onConflict: 'season_id,fpl_entry_id' }
        );
        const { data: userData } = await supabase
          .from('users').select('id').eq('season_id', season.id).eq('fpl_entry_id', parseInt(entryId)).single();
        if (!userData) throw new Error('User not found in database');
        const userId = userData.id;

        // --- Step 3: Squad history picks ---
        const history = await getEntryHistory<Record<string, any>>(entryId);
        const totalGWs = history.current.length;

        send({ step: 'picks_start', message: `Syncing ${totalGWs} gameweek squads...`, total: totalGWs, done: resumeFrom });

        for (let i = resumeFrom; i < totalGWs; i++) {
          const gw = history.current[i];

          const { data: squadData } = await supabase
            .from('squads')
            .upsert({
              user_id: userId,
              season_id: season.id,
              gameweek_id: gw.event,
              bank_balance: gw.bank / 10,
            }, { onConflict: 'user_id,season_id,gameweek_id' })
            .select('id')
            .single();

          if (squadData) {
            try {
              const picksData = await getPicks(entryId, gw.event);
              const squadPlayers = picksData.picks.map((pick: any) => ({
                squad_id: squadData.id,
                season_id: season.id,
                player_id: pick.element,
                multiplier: pick.multiplier,
                is_vice_captain: pick.is_vice_captain,
                pitch_position: pick.position,
              }));
              await supabase.from('squad_players').upsert(squadPlayers, { onConflict: 'squad_id,player_id' });
            } catch (error) {
              if (!(error instanceof FplApiError && error.code === 'picks_unavailable')) throw error;
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
