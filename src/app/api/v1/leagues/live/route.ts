import { NextRequest, NextResponse } from 'next/server';
import { FplApiError, getBootstrap, getClassicLeagueStandings, getLiveEvent, getPicks } from '@/lib/fpl/client';
import { resolveGameweekContext } from '@/lib/fpl/gameweekContext';

export async function GET(req: NextRequest) {
  try {
    const entryId = req.cookies.get('fpl_entry_id')?.value;
    const { searchParams } = new URL(req.url);
    const leagueId = searchParams.get('id');

    if (!entryId || !leagueId) {
      return NextResponse.json({ error: 'Missing entryId or leagueId' }, { status: 400 });
    }

    const bootstrap = await getBootstrap();
    const context = resolveGameweekContext(bootstrap.events);
    const gameweek = context.currentGW ?? context.planningGW;
    if (!gameweek) return NextResponse.json({ error: 'Gameweek data is not available', code: context.state }, { status: 409 });
    const liveData = await getLiveEvent<{ elements?: Array<{ id: number; stats: Record<string, number> }> }>(gameweek);
    const liveMap = new Map(liveData.elements?.map((el) => [el.id, el.stats]) || []);

    // 2. Fetch League Standings
    const leagueData = await getClassicLeagueStandings<Record<string, any>>(leagueId);

    // Limit to top 15 for performance
    const rivals = leagueData.standings.results.slice(0, 15);

    // 3. For each rival, fetch their live GW score
    const liveStandings = await Promise.all(rivals.map(async (rival: any) => {
      try {
        const picksData = await getPicks(rival.entry, gameweek);

        let gwLivePoints = 0;
        for (const pick of picksData.picks) {
          if (pick.position > 11) continue; // skip bench
          const stats: any = liveMap.get(pick.element) || { total_points: 0 };
          gwLivePoints += (stats.total_points || 0) * pick.multiplier;
        }

        // Total Live Points = Total points before this GW + GW Live points - GW Hits
        const liveTotal = (rival.total - (rival.event_total || 0)) + gwLivePoints - (picksData.entry_history?.event_transfers_cost || 0);

        return {
          entry: rival.entry,
          player_name: rival.player_name,
          entry_name: rival.entry_name,
          rank: rival.rank,
          last_rank: rival.last_rank,
          gw_points: gwLivePoints,
          live_total: liveTotal,
          hits: picksData.entry_history?.event_transfers_cost || 0,
        };
      } catch {
        return {
          entry: rival.entry,
          player_name: rival.player_name,
          entry_name: rival.entry_name,
          rank: rival.rank,
          last_rank: rival.last_rank,
          gw_points: rival.event_total,
          live_total: rival.total,
          hits: 0,
        };
      }
    }));

    // Re-rank based on live total
    const sortedStandings = [...liveStandings].sort((a, b) => b.live_total - a.live_total);
    const finalStandings = sortedStandings.map((s, index) => ({
      ...s,
      live_rank: index + 1,
      movement: (s.rank - (index + 1))
    }));

    return NextResponse.json({
      league_name: leagueData.league.name,
      standings: finalStandings,
      total_entries: leagueData.standings.results.length // For mini-leagues we usually have all in one page, or we can use the league metadata
    });

  } catch (error: any) {
    if (error instanceof FplApiError) return NextResponse.json({ error: error.message, code: error.code, path: error.path }, { status: error.status });
    console.error('League Live Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
