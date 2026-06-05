import { NextRequest, NextResponse } from 'next/server';
import { fifaFetch, getBootstrap } from '@/lib/fifaApi';

export async function GET(req: NextRequest) {
  try {
    const entryId = req.cookies.get('fpl_entry_id')?.value;
    if (!entryId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [historyData, bootstrap] = await Promise.all([
      fifaFetch(`/entry/${entryId}/history/`),
      getBootstrap(),
    ]);

    const mdAverages = new Map(bootstrap.events.map(e => [e.id, e.average_entry_score]));

    const currentWithAverages = (historyData.current || []).map((h: any) => ({
      ...h,
      avg_points: mdAverages.get(h.event) || 0,
      avg_score: mdAverages.get(h.event) || 0,
    }));

    return NextResponse.json({ ...historyData, current: currentWithAverages });
  } catch (error) {
    console.error('History API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
