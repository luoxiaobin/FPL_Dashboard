import { NextRequest, NextResponse } from 'next/server';

let bootstrapCache: any = null;
let lastFetchTime = 0;

async function getBootstrap() {
  const now = Date.now();
  if (bootstrapCache && (now - lastFetchTime) < 3600000) { // 1 hour cache
    return bootstrapCache;
  }
  const res = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/');
  if (res.ok) {
    bootstrapCache = await res.json();
    lastFetchTime = now;
  }
  return bootstrapCache;
}

export async function GET(req: NextRequest) {
  try {
    const entryId = req.cookies.get('fpl_entry_id')?.value;

    if (!entryId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bootstrap = await getBootstrap();
    if (!bootstrap) throw new Error('Failed to load bootstrap data');

    const currentEvent = bootstrap.events.find((e: any) => e.is_current) || bootstrap.events.find((e: any) => e.is_next);
    const gameweek = currentEvent ? currentEvent.id : 1;

    // 1. Get Picks
    const picksRes = await fetch(`https://fantasy.premierleague.com/api/entry/${entryId}/event/${gameweek}/picks/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      }
    });

    if (!picksRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch picks' }, { status: picksRes.status });
    }
    const picksData = await picksRes.json();

    // 2. Get Live Points
    const liveRes = await fetch(`https://fantasy.premierleague.com/api/event/${gameweek}/live/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      }
    });
    const liveData = liveRes.ok ? await liveRes.json() : { elements: [] };

    // Create lookup maps
    const liveMap = new Map(liveData.elements?.map((el: any) => [el.id, el.stats]) || []);
    const elementTypesMap = new Map(bootstrap.element_types.map((type: any) => [type.id, type.singular_name_short]));
    const elementsMap = new Map(bootstrap.elements.map((el: any) => [el.id, el]));

    // 3. Combine Data
    const players = picksData.picks.map((pick: any) => {
      const playerStatic: any = elementsMap.get(pick.element) || {};
      const playerLive: any = liveMap.get(pick.element) || { total_points: 0, minutes: 0 };
      const posName = elementTypesMap.get(playerStatic.element_type) || 'UNK';

      return {
        id: pick.element,
        name: playerStatic.web_name || 'Unknown',
        position: posName,
        live_points: playerLive.total_points || 0,
        bps: playerLive.bps || 0,
        bonus: playerLive.bonus || 0,
        is_captain: pick.is_captain,
        minutes: playerLive.minutes || 0,
        status: playerStatic.status || 'a',
        price: (playerStatic.now_cost || 0) / 10
      };
    });

    return NextResponse.json({
      gameweek,
      players
    });

  } catch (error) {
    console.error('Squad Live Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
