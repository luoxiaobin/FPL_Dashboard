import { NextRequest, NextResponse } from 'next/server';
import { getEntryIdFromSession } from '@/lib/session';
import { toSafeId } from '@/lib/upstreamFetch';
import { loadLatestBacktest } from '@/server/planning/backtest';

export async function GET(request: NextRequest) {
  const entryId = await getEntryIdFromSession(request);
  if (!entryId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    return NextResponse.json(await loadLatestBacktest(String(toSafeId(entryId, 'entryId'))), {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    console.error('Planning backtest failed:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Backtest is temporarily unavailable.' }, { status: 503 });
  }
}
