import { NextRequest, NextResponse } from 'next/server';
import { buildClubFormMap } from '@/lib/clubForm';
import { FplApiError, getBootstrap, getFixtures, getLiveEvent, getPicks } from '@/lib/fpl/client';
import { resolveGameweekContext } from '@/lib/fpl/gameweekContext';

export async function GET(req: NextRequest) {
  try {
    const entryId = req.cookies.get('fpl_entry_id')?.value;

    if (!entryId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bootstrap = await getBootstrap();
    const context = resolveGameweekContext(bootstrap.events);
    const gameweek = context.picksGW;

    if (!gameweek) {
      return NextResponse.json({
        error: 'FPL gameweek data is not available yet.',
        code: context.state,
        season: context.seasonCode,
        planning_gameweek: context.planningGW,
      }, { status: 409 });
    }

    // 1. Get Picks
    const picksData = await getPicks(entryId, gameweek);

    // 2. Get Live Points and Fixtures
    const [liveData, fixturesData] = await Promise.all([
      getLiveEvent<{ elements?: Array<{ id: number; stats: Record<string, number> }> }>(gameweek),
      getFixtures(gameweek),
    ]);

    // Create lookup maps
    const liveMap = new Map(liveData.elements?.map((el) => [el.id, el.stats]) || []);
    const elementTypesMap = new Map(bootstrap.element_types.map((type: any) => [type.id, type.singular_name_short]));
    const elementsMap = new Map(bootstrap.elements.map((el: any) => [el.id, el]));
    
    // Map teams to fixture finish status
    const teamFinishedMap = new Map<number, boolean>();
    const finishedFixtures = (fixturesData as any[]).filter((f: any) => f.finished || f.finished_provisional);
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
    if (error instanceof FplApiError) {
      const status = error.code === 'picks_unavailable' ? 409 : error.status;
      return NextResponse.json({ error: error.message, code: error.code, path: error.path }, { status });
    }
    console.error('Squad Live Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
