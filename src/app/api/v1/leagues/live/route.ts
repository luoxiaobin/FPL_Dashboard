import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const entryId = req.cookies.get('fpl_entry_id')?.value;
    const { searchParams } = new URL(req.url);
    const leagueId = searchParams.get('id');

    if (!entryId || !leagueId) {
      return NextResponse.json({ error: 'Missing entryId or leagueId' }, { status: 400 });
    }

    // 1. Fetch Bootstrap (GW info) & Live Points
    const bootstrapRes = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/', { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const bootstrap = await bootstrapRes.json();
    const currentGW = bootstrap.events.find((e: any) => e.is_current) || bootstrap.events.find((e: any) => e.is_next);
    
    const liveRes = await fetch(`https://fantasy.premierleague.com/api/event/${currentGW.id}/live/`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const liveData = await liveRes.json();
    const liveMap = new Map(liveData.elements?.map((el: any) => [el.id, el.stats]) || []);

    // 2. Fetch League Standings
    const leagueRes = await fetch(`https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!leagueRes.ok) throw new Error('Failed to fetch league standings');
    const leagueData = await leagueRes.json();

    // Limit to top 15 for performance
    const rivals = leagueData.standings.results.slice(0, 15);

    // 3. For each rival, fetch their live GW score
    const liveStandings = await Promise.all(rivals.map(async (rival: any) => {
      try {
        const picksRes = await fetch(`https://fantasy.premierleague.com/api/entry/${rival.entry}/event/${currentGW.id}/picks/`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!picksRes.ok) throw new Error();
        const picksData = await picksRes.json();

        let gwLivePoints = 0;
        for (const pick of picksData.picks) {
          if (pick.position > 11) continue; // skip bench
          const stats: any = liveMap.get(pick.element) || { total_points: 0 };
          gwLivePoints += (stats.total_points || 0) * pick.multiplier;
        }

        // Total Live Points = Total points before this GW + GW Live points - GW Hits
        const liveTotal = (rival.total - (rival.event_total || 0)) + gwLivePoints - (picksData.entry_history.event_transfers_cost || 0);

        return {
          entry: rival.entry,
          player_name: rival.player_name,
          entry_name: rival.entry_name,
          rank: rival.rank,
          last_rank: rival.last_rank,
          gw_points: gwLivePoints,
          live_total: liveTotal,
          hits: picksData.entry_history.event_transfers_cost || 0,
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
    console.error('League Live Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
