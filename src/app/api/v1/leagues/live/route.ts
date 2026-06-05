import { NextRequest, NextResponse } from 'next/server';
import { getBootstrap, fifaFetch } from '@/lib/fifaApi';

export async function GET(req: NextRequest) {
  try {
    const entryId = req.cookies.get('fpl_entry_id')?.value;
    const { searchParams } = new URL(req.url);
    const leagueId = searchParams.get('id');
    if (!entryId || !leagueId) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

    const bootstrap = await getBootstrap();
    const currentEvent =
      bootstrap.events.find(e => e.is_current) ||
      bootstrap.events.find(e => e.is_next);

    const [liveData, leagueData] = await Promise.all([
      fifaFetch(`/event/${currentEvent!.id}/live/`),
      fifaFetch(`/leagues-classic/${leagueId}/standings/`),
    ]);

    const liveMap = new Map(
      (liveData.elements ?? []).map((el: any) => [el.id, el.stats])
    );
    const rivals = leagueData.standings.results.slice(0, 15);

    const liveStandings = await Promise.all(
      rivals.map(async (rival: any) => {
        try {
          const picksData = await fifaFetch(
            `/entry/${rival.entry}/event/${currentEvent!.id}/picks/`
          );
          let gwLivePoints = 0;
          for (const pick of picksData.picks) {
            if (pick.position > 11) continue;
            const stats: any = liveMap.get(pick.element) || { total_points: 0 };
            gwLivePoints += (stats.total_points || 0) * pick.multiplier;
          }
          const liveTotal =
            rival.total - (rival.event_total || 0) + gwLivePoints -
            (picksData.entry_history.event_transfers_cost || 0);
          return {
            entry: rival.entry, player_name: rival.player_name,
            entry_name: rival.entry_name, rank: rival.rank, last_rank: rival.last_rank,
            gw_points: gwLivePoints, live_total: liveTotal,
            hits: picksData.entry_history.event_transfers_cost || 0,
          };
        } catch {
          return {
            entry: rival.entry, player_name: rival.player_name,
            entry_name: rival.entry_name, rank: rival.rank, last_rank: rival.last_rank,
            gw_points: rival.event_total, live_total: rival.total, hits: 0,
          };
        }
      })
    );

    const sorted = [...liveStandings].sort((a, b) => b.live_total - a.live_total);
    const final = sorted.map((s, i) => ({ ...s, live_rank: i + 1, movement: s.rank - (i + 1) }));

    return NextResponse.json({
      league_name: leagueData.league.name,
      standings: final,
      total_entries: leagueData.standings.results.length,
    });
  } catch (error) {
    console.error('League Live Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
