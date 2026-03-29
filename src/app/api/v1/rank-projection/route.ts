import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const entryId = req.cookies.get('fpl_entry_id')?.value;
    if (!entryId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch bootstrap to get current GW and average scores
    const bootstrapRes = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!bootstrapRes.ok) throw new Error('Failed to fetch bootstrap');
    const bootstrap = await bootstrapRes.json();

    const currentGW = bootstrap.events.find((e: any) => e.is_current);
    if (!currentGW) {
      return NextResponse.json({ status: 'no_active_gw', message: 'No active gameweek right now.' });
    }

    const gwAverage = currentGW.average_entry_score || 0;
    const totalPlayers = bootstrap.total_players || 11000000;

    // Fetch user's current live squad score
    const liveRes = await fetch(`https://fantasy.premierleague.com/api/event/${currentGW.id}/live/`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!liveRes.ok) throw new Error('Failed to fetch live data');
    const liveData = await liveRes.json();

    const picksRes = await fetch(`https://fantasy.premierleague.com/api/entry/${entryId}/event/${currentGW.id}/picks/`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!picksRes.ok) throw new Error('Failed to fetch picks');
    const picksData = await picksRes.json();

    // Calculate user's live total
    const liveMap = new Map(liveData.elements?.map((el: any) => [el.id, el.stats]) || []);
    let liveTotal = 0;
    for (const pick of picksData.picks) {
      if (pick.position > 11) continue; // skip bench
      const stats: any = liveMap.get(pick.element) || { total_points: 0 };
      liveTotal += (stats.total_points || 0) * pick.multiplier;
    }

    // Fetch user's overall rank before this GW
    const entryRes = await fetch(`https://fantasy.premierleague.com/api/entry/${entryId}/`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const entryData = entryRes.ok ? await entryRes.json() : {};
    const currentOverallRank = entryData.summary_overall_rank || 0;

    // Rank projection: estimate percentile shift
    // If your score > average => moving up (rank improves), if < average => moving down
    const scoreDelta = liveTotal - gwAverage;
    // Rough heuristic: each point above/below average shifts rank by ~0.7% of total players
    const rankDelta = Math.round(scoreDelta * totalPlayers * 0.007 * -1);
    const projectedRank = Math.max(1, currentOverallRank + rankDelta);

    return NextResponse.json({
      status: 'live',
      gameweek: currentGW.id,
      liveScore: liveTotal,
      gwAverage,
      scoreDelta,
      currentRank: currentOverallRank,
      projectedRank,
      rankDelta,
      totalPlayers,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Rank Projection Error:', message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
