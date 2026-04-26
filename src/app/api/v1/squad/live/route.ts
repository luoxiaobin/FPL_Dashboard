import { NextRequest, NextResponse } from 'next/server';
import { buildClubFormMap } from '@/lib/clubForm';

// Per-instance in-memory cache. In a distributed deployment each instance has its own copy;
// this is best-effort latency reduction, not a shared cache.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let bootstrapCache: any = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 900_000; // 15 minutes

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getBootstrap(): Promise<any> {
  const now = Date.now();
  if (bootstrapCache && (now - lastFetchTime) < CACHE_TTL_MS) {
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

    // 2. Get Live Points and Fixtures
    const [liveRes, fixturesRes] = await Promise.all([
      fetch(`https://fantasy.premierleague.com/api/event/${gameweek}/live/`, { headers: { 'User-Agent': 'Mozilla/5.0' } }),
      fetch(`https://fantasy.premierleague.com/api/fixtures/?event=${gameweek}`, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    ]);
    
    const liveData = liveRes.ok ? await liveRes.json() : { elements: [] };
    const fixturesData = fixturesRes.ok ? await fixturesRes.json() : [];

    // Create lookup maps
    const liveMap = new Map(liveData.elements?.map((el: any) => [el.id, el.stats]) || []);
    const elementTypesMap = new Map(bootstrap.element_types.map((type: any) => [type.id, type.singular_name_short]));
    const elementsMap = new Map(bootstrap.elements.map((el: any) => [el.id, el]));
    
    // Map teams to fixture finish status
    const teamFinishedMap = new Map<number, boolean>();
    const finishedFixtures = fixturesData.filter((f: any) => f.finished || f.finished_provisional);
    finishedFixtures.forEach((f: any) => {
      teamFinishedMap.set(f.team_h, true);
      teamFinishedMap.set(f.team_a, true);
    });

    const clubFormMap = buildClubFormMap(finishedFixtures, bootstrap.teams as Array<{ id: number }>);

    const teamCodeMap = new Map(bootstrap.teams.map((t: any) => [t.id, t.code]));

    // 3. Combine Data
    const players = picksData.picks.map((pick: any) => {
      const playerStatic: any = elementsMap.get(pick.element) || {};
      const playerLive: any = liveMap.get(pick.element) || { total_points: 0, minutes: 0 };
      const posName = elementTypesMap.get(playerStatic.element_type) || 'UNK';

      return {
        id: pick.element,
        name: playerStatic.web_name || 'Unknown',
        position: posName,
        official_pos: pick.position,
        multiplier: pick.multiplier,
        live_points: playerLive.total_points || 0,
        bps: playerLive.bps || 0,
        bonus: playerLive.bonus || 0,
        is_captain: pick.is_captain,
        is_vice_captain: pick.is_vice_captain,
        minutes: playerLive.minutes || 0,
        status: playerStatic.status || 'a',
        price: (playerStatic.now_cost || 0) / 10,
        is_finished: teamFinishedMap.get(playerStatic.team) ?? false,
        was_started: pick.position <= 11,
        photo: playerStatic.code ? String(playerStatic.code) : playerStatic.photo?.replace('.jpg', ''),
        teamCode: teamCodeMap.get(playerStatic.team),
        clubForm: clubFormMap.get(playerStatic.team) || ''
      };
    });

    // 4. Calculate Projected Total
    const starters = players.filter((p: any) => p.was_started);
    const bench = players.filter((p: any) => !p.was_started);
    const missingStarters = starters.filter((p: any) => p.minutes === 0 && p.is_finished);
    
    let subPoints = 0;
    const availableBench = [...bench];
    missingStarters.forEach(() => {
      const subIdx = availableBench.findIndex((p: any) => p.minutes > 0 || !p.is_finished);
      if (subIdx !== -1) {
        subPoints += availableBench[subIdx].live_points;
        availableBench.splice(subIdx, 1);
      }
    });

    const projectedPoints = starters.reduce((acc: number, p: any) => {
      if (missingStarters.find((m: any) => m.id === p.id)) return acc;
      return acc + (p.live_points * (p.multiplier || 1));
    }, 0) + subPoints;

    // 5. Determine Point Lifecycle Status
    let status: 'live' | 'provisional' | 'official' = 'live';
    const eventStatus = bootstrap.events.find((e: any) => e.id === gameweek);
    
    if (eventStatus?.finished && eventStatus?.data_checked) {
      status = 'official';
    } else {
      const allMatchesFinished = fixturesData.length > 0 && fixturesData.every((f: any) => f.finished || f.finished_provisional);
      if (allMatchesFinished) {
        status = 'provisional';
      }
    }

    return NextResponse.json({
      gameweek,
      status,
      players,
      projected_points: projectedPoints
    });

  } catch (error) {
    console.error('Squad Live Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
