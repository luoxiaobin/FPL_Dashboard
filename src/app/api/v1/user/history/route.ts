import { NextRequest, NextResponse } from 'next/server';
import { getEntryIdFromSession } from '@/lib/session';
import { fplFetch, toSafeId } from '@/lib/upstreamFetch';

export async function GET(req: NextRequest) {
  try {
    const rawEntryId = await getEntryIdFromSession(req);
    if (!rawEntryId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const entryId = toSafeId(rawEntryId, 'entryId');

    const [historyRes, bootstrapRes] = await Promise.all([
      fplFetch(`/api/entry/${entryId}/history/`, { headers: { 'User-Agent': 'Mozilla/5.0' } }),
      fplFetch(`/api/bootstrap-static/`, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    ]);

    if (!historyRes.ok || !bootstrapRes.ok) {
      return NextResponse.json({ error: 'FPL API Error' }, { status: 502 });
    }

    const historyData = await historyRes.json();
    const bootstrapData = await bootstrapRes.json();

    const gwAverages = new Map(bootstrapData.events.map((e: any) => [e.id, e.average_entry_score]));

    // Merge average scores into current history
    const currentWithAverages = (historyData.current || []).map((h: any) => ({
      ...h,
      avg_points: gwAverages.get(h.event) || 0,
      avg_score: gwAverages.get(h.event) || 0 // Keep both for compatibility
    }));

    return NextResponse.json({
      ...historyData,
      current: currentWithAverages
    });

  } catch (error) {
    console.error('History API Proxy Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
