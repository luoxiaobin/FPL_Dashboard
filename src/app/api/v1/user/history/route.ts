import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const entryId = req.cookies.get('fpl_entry_id')?.value;

    if (!entryId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [historyRes, staticRes] = await Promise.all([
      fetch(`https://fantasy.premierleague.com/api/entry/${entryId}/history/`, { headers: { 'User-Agent': 'Mozilla/5.0' } }),
      fetch(`https://fantasy.premierleague.com/api/bootstrap-static/`, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    ]);

    if (!historyRes.ok || !staticRes.ok) {
      return NextResponse.json({ error: 'FPL API Error' }, { status: 502 });
    }

    const historyData = await historyRes.json();
    const staticData = await staticRes.json();

    // Map global averages to user's history events
    const avgs = new Map(staticData.events.map((e: any) => [e.id, e.average_entry_score]));
    
    if (historyData.current) {
      historyData.current = historyData.current.map((gw: any) => ({
        ...gw,
        avg_score: avgs.get(gw.event) || 0
      }));
    }

    return NextResponse.json(historyData);

  } catch (error) {
    console.error('History API Proxy Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
