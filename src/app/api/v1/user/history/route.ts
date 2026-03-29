import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const entryId = req.cookies.get('fpl_entry_id')?.value;

    if (!entryId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [historyRes, bootstrapRes] = await Promise.all([
      fetch(`https://fantasy.premierleague.com/api/entry/${entryId}/history/`, { headers: { 'User-Agent': 'Mozilla/5.0' } }),
      fetch(`https://fantasy.premierleague.com/api/bootstrap-static/`, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    ]);

    if (!historyRes.ok || !bootstrapRes.ok) {
      return NextResponse.json({ error: 'FPL API Error' }, { status: 500 });
    }

    const historyData = await historyRes.json();
    const bootstrapData = await bootstrapRes.json();

    const gwAverages = new Map(bootstrapData.events.map((e: any) => [e.id, e.average_entry_score]));

    // Merge average scores into current history
    const currentWithAverages = historyData.current.map((h: any) => ({
      ...h,
      avg_points: gwAverages.get(h.event) || 0
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
