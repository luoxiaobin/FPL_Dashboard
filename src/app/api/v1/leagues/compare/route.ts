import { NextRequest, NextResponse } from 'next/server';
import { FplApiError, getBootstrap, getLiveEvent, getPicks } from '@/lib/fpl/client';
import { resolveGameweekContext } from '@/lib/fpl/gameweekContext';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const myId = searchParams.get('myId');
    const rivalId = searchParams.get('rivalId');

    if (!myId || !rivalId) {
      return NextResponse.json({ error: 'Missing entry IDs' }, { status: 400 });
    }

    const bootstrap = await getBootstrap();
    const context = resolveGameweekContext(bootstrap.events);
    const gameweek = context.currentGW ?? context.planningGW;
    if (!gameweek) return NextResponse.json({ error: 'Gameweek data is not available', code: context.state }, { status: 409 });
    const liveData = await getLiveEvent<{ elements?: Array<{ id: number; stats: Record<string, number> }> }>(gameweek);
    const liveMap = new Map(liveData.elements?.map((el) => [el.id, el.stats]) || []);

    const [myPicks, rivalPicks] = await Promise.all([
      getPicks(myId, gameweek),
      getPicks(rivalId, gameweek),
    ]);

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
    if (error instanceof FplApiError) return NextResponse.json({ error: error.message, code: error.code, path: error.path }, { status: error.status });
    console.error('Comparison Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
