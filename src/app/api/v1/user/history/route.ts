import { NextRequest, NextResponse } from 'next/server';
import { FplApiError, getBootstrap, getEntryHistory } from '@/lib/fpl/client';
import { resolveGameweekContext } from '@/lib/fpl/gameweekContext';

export async function GET(req: NextRequest) {
  try {
    const entryId = req.cookies.get('fpl_entry_id')?.value;

    if (!entryId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [historyData, bootstrapData] = await Promise.all([
      getEntryHistory<Record<string, any>>(entryId),
      getBootstrap(),
    ]);

    const context = resolveGameweekContext(bootstrapData.events);

    const gwAverages = new Map(bootstrapData.events.map((e: any) => [e.id, e.average_entry_score]));

    // Merge average scores into current history
    const currentWithAverages = (historyData.current || []).map((h: any) => ({
      ...h,
      avg_points: gwAverages.get(h.event) || 0,
      avg_score: gwAverages.get(h.event) || 0 // Keep both for compatibility
    }));

    return NextResponse.json({
      ...historyData,
      current: currentWithAverages,
      season: context.seasonCode,
      season_state: context.state,
      current_gameweek: context.currentGW,
      planning_gameweek: context.planningGW
    });

  } catch (error) {
    if (error instanceof FplApiError) {
      return NextResponse.json({ error: error.message, code: error.code, path: error.path }, { status: error.status });
    }
    console.error('History API Proxy Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
