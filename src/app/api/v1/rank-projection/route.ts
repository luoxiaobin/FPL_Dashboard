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

    const isFinal = currentGW.finished && currentGW.data_checked;

    // Fetch user's history for accurate movement comparison
    const historyRes = await fetch(`https://fantasy.premierleague.com/api/entry/${entryId}/history/`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const historyData = await historyRes.json();
    const lastGW = historyData.current.find((h: any) => h.event === currentGW.id - 1);
    const prevRank = lastGW?.overall_rank || currentOverallRank;

    let projectedRank = currentOverallRank;
    let rankDelta = currentOverallRank - prevRank;

    if (!isFinal) {
      // Advanced Rank Projection (Conservative Sigmoid Heuristic)
      let ranksPerPoint = 40000;
      if (currentOverallRank < 10000) ranksPerPoint = 100;
      else if (currentOverallRank < 100000) ranksPerPoint = 1200;
      else if (currentOverallRank < 400000) ranksPerPoint = 5000;
      else if (currentOverallRank < 2000000) ranksPerPoint = 20000;

      const scoreDelta = liveTotal - gwAverage;
      const conservativeDelta = scoreDelta * 0.8;
      const calcDelta = Math.round(conservativeDelta * ranksPerPoint * -1);
      projectedRank = Math.max(1, currentOverallRank + calcDelta);
      rankDelta = projectedRank - currentOverallRank;
    }

    // 5. Tier Tracking
    const tiers = [1, 100, 1000, 10000, 50000, 100000, 250000, 500000, 1000000, 2000000, 5000000];
    const displayRank = isFinal ? currentOverallRank : projectedRank;
    const nextTier = tiers.find(t => t < displayRank) || 1;
    const ranksPerPoint = currentOverallRank < 100000 ? 1200 : 5000; 
    const pointsToNextTier = Math.ceil(Math.abs(displayRank - nextTier) / ranksPerPoint);

    return NextResponse.json({
      status: isFinal ? 'final' : 'live',
      gameweek: currentGW.id,
      liveScore: liveTotal,
      gwAverage,
      scoreDelta: liveTotal - gwAverage,
      currentRank: isFinal ? prevRank : currentOverallRank,
      projectedRank: isFinal ? currentOverallRank : projectedRank,
      rankDelta,
      pointsToNextTier,
      nextTier,
      totalPlayers,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Rank Projection Error:', message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
