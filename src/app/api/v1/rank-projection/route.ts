import { NextRequest, NextResponse } from 'next/server';
import { FplApiError, getBootstrap, getEntry, getEntryHistory, getLiveEvent, getPicks } from '@/lib/fpl/client';
import { resolveGameweekContext } from '@/lib/fpl/gameweekContext';

export async function GET(req: NextRequest) {
  try {
    const entryId = req.cookies.get('fpl_entry_id')?.value;
    if (!entryId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bootstrap = await getBootstrap();
    const context = resolveGameweekContext(bootstrap.events);
    const gameweek = context.currentGW ?? context.planningGW;
    const currentGW = gameweek ? bootstrap.events.find((event: any) => event.id === gameweek) : null;
    if (!currentGW || !gameweek) return NextResponse.json({ status: 'no_active_gw', message: 'No active gameweek right now.', season: context.seasonCode }, { status: 409 });

    const gwAverage = currentGW.average_entry_score || 0;
    const totalPlayers = bootstrap.total_players || 11000000;

    const [liveData, picksData] = await Promise.all([
      getLiveEvent<{ elements?: Array<{ id: number; stats: Record<string, number> }> }>(gameweek),
      getPicks(entryId, gameweek),
    ]);

    // Calculate user's live total
    const liveMap = new Map(liveData.elements?.map((el: any) => [el.id, el.stats]) || []);
    let liveTotal = 0;
    for (const pick of picksData.picks) {
      if (pick.position > 11) continue; // skip bench
      const stats: any = liveMap.get(pick.element) || { total_points: 0 };
      liveTotal += (stats.total_points || 0) * pick.multiplier;
    }

    const entryData = await getEntry<Record<string, any>>(entryId);
    const currentOverallRank = entryData.summary_overall_rank || 0;

    const isFinal = currentGW.finished && currentGW.data_checked;

    const historyData = await getEntryHistory<Record<string, any>>(entryId);
    const lastGW = historyData.current?.find((h: any) => h.event === currentGW.id - 1);
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
    if (error instanceof FplApiError) return NextResponse.json({ error: error.message, code: error.code, path: error.path }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Rank Projection Error:', message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
