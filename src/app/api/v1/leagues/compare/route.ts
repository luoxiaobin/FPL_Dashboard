import { NextRequest, NextResponse } from 'next/server';
import { getEntryIdFromSession } from '@/lib/session';
import { fplFetch, toSafeId } from '@/lib/upstreamFetch';

export async function GET(req: NextRequest) {
  try {
    const rawEntryId = await getEntryIdFromSession(req);
    if (!rawEntryId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const myIdParam = searchParams.get('myId');
    const rivalIdParam = searchParams.get('rivalId');

    if (!myIdParam || !rivalIdParam) {
      return NextResponse.json({ error: 'Missing entry IDs' }, { status: 400 });
    }

    // Ensure both IDs are numeric (prevent path traversal / SSRF-adjacent abuse)
    let myId: string;
    let rivalId: string;
    try {
      myId = toSafeId(myIdParam, 'myId');
      rivalId = toSafeId(rivalIdParam, 'rivalId');
    } catch {
      return NextResponse.json({ error: 'Entry IDs must be numeric' }, { status: 400 });
    }

    // 1. Fetch Bootstrap (Player names/positions) & Live Points
    const bootstrapRes = await fplFetch('/api/bootstrap-static/', { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const bootstrap = await bootstrapRes.json();
    const currentGW = bootstrap.events.find((e: any) => e.is_current) || bootstrap.events.find((e: any) => e.is_next);

    const liveRes = await fplFetch(`/api/event/${toSafeId(currentGW.id, 'gameweek')}/live/`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const liveData = await liveRes.json();
    const liveMap = new Map(liveData.elements?.map((el: any) => [el.id, el.stats]) || []);

    // 2. Fetch Picks for both
    const [myPicksRes, rivalPicksRes] = await Promise.all([
      fplFetch(`/api/entry/${myId}/event/${toSafeId(currentGW.id, 'gameweek')}/picks/`, { headers: { 'User-Agent': 'Mozilla/5.0' } }),
      fplFetch(`/api/entry/${rivalId}/event/${toSafeId(currentGW.id, 'gameweek')}/picks/`, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    ]);

    if (!myPicksRes.ok || !rivalPicksRes.ok) throw new Error('Failed to fetch picks');
    const myPicks = await myPicksRes.json();
    const rivalPicks = await rivalPicksRes.json();

    const elementsMap = new Map(bootstrap.elements.map((el: any) => [el.id, el]));

    const formatPlayer = (pick: any) => {
      const el: any = elementsMap.get(pick.element) || {};
      const stats: any = liveMap.get(pick.element) || { total_points: 0 };
      return {
        id: pick.element,
        name: el.web_name,
        points: (stats.total_points || 0) * pick.multiplier,
        isCaptain: pick.is_captain,
        isVice: pick.is_vice_captain,
        multiplier: pick.multiplier,
        position: pick.position,
      };
    };

    const myPlayers = myPicks.picks.map(formatPlayer);
    const rivalPlayers = rivalPicks.picks.map(formatPlayer);

    const myIds = new Set(myPlayers.map((p: any) => p.id));
    const rivalIds = new Set(rivalPlayers.map((p: any) => p.id));

    return NextResponse.json({
      myCaptain: myPlayers.find((p: any) => p.isCaptain),
      rivalCaptain: rivalPlayers.find((p: any) => p.isCaptain),
      differentials: myPlayers.filter((p: any) => !rivalIds.has(p.id)),
      dangers: rivalPlayers.filter((p: any) => !myIds.has(p.id)),
      common: myPlayers.filter((p: any) => rivalIds.has(p.id)).map((p: any) => ({
        ...p,
        rivalPoints: rivalPlayers.find((rp: any) => rp.id === p.id)?.points || 0
      }))
    });

  } catch (error: any) {
    console.error('Comparison Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
