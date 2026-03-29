import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const entryId = req.cookies.get('fpl_entry_id')?.value;
    if (!entryId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch Transfer History
    const transRes = await fetch(`https://fantasy.premierleague.com/api/entry/${entryId}/transfers/`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (!transRes.ok) throw new Error('Failed to fetch transfer history');
    const transfers = await transRes.json();

    // 2. Fetch Bootstrap for player names
    const bootstrapRes = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const bootstrap = await bootstrapRes.json();
    const playersMap = new Map(bootstrap.elements.map((p: any) => [p.id, p]));

    // 3. Cache for player summaries to avoid redundant API calls within the same request
    const summaryCache = new Map<number, any>();

    const getPlayerPointsInGW = async (playerId: number, gw: number) => {
      if (!summaryCache.has(playerId)) {
        const res = await fetch(`https://fantasy.premierleague.com/api/element-summary/${playerId}/`, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        if (res.ok) {
          summaryCache.set(playerId, await res.json());
        }
      }
      const summary = summaryCache.get(playerId);
      const gwData = summary?.history?.find((h: any) => h.round === gw);
      return gwData?.total_points ?? 0;
    };

    // 4. Process transfers to add names and calculate "Points Impact"
    const processedTransfers = await Promise.all(transfers.map(async (t: any) => {
      const pIn = playersMap.get(t.element_in) as any;
      const pOut = playersMap.get(t.element_out) as any;

      const [pointsIn, pointsOut] = await Promise.all([
        getPlayerPointsInGW(t.element_in, t.event),
        getPlayerPointsInGW(t.element_out, t.event)
      ]);
      
      return {
        id: `${t.entry}-${t.time}`,
        gw: t.event,
        time: t.time,
        playerIn: pIn?.web_name || 'Unknown',
        playerOut: pOut?.web_name || 'Unknown',
        costIn: t.element_in_cost / 10,
        costOut: t.element_out_cost / 10,
        pointsIn,
        pointsOut,
        pointsImpact: pointsIn - pointsOut,
      };
    }));

    return NextResponse.json({
      transfers: processedTransfers.reverse(), // Latest first
      totalTransfers: transfers.length,
    });

  } catch (error: any) {
    console.error('Transfer Analyser Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
