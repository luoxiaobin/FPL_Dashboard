import { NextRequest, NextResponse } from 'next/server';
import { getBootstrap, fifaFetch, FIFA_POSITION_NAMES } from '@/lib/fifaApi';

export async function GET(req: NextRequest) {
  try {
    const entryId = req.cookies.get('fpl_entry_id')?.value;
    if (!entryId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const bootstrap = await getBootstrap();
    if (!bootstrap) throw new Error('Failed to load bootstrap data');

    const currentEvent =
      bootstrap.events.find(e => e.is_current) ||
      bootstrap.events.find(e => e.is_next);
    const matchday = currentEvent ? currentEvent.id : 1;

    const [picksData, liveData, fixturesData] = await Promise.all([
      fifaFetch(`/entry/${entryId}/event/${matchday}/picks/`),
      fifaFetch(`/event/${matchday}/live/`).catch(() => ({ elements: [] })),
      fifaFetch(`/fixtures/?event=${matchday}`).catch(() => []),
    ]);

    const liveMap = new Map(
      (liveData.elements ?? []).map((el: any) => [el.id, el.stats])
    );
    const elementsMap = new Map(bootstrap.elements.map(el => [el.id, el]));
    const elementTypesMap = new Map(
      bootstrap.element_types.map(t => [t.id, t.singular_name_short])
    );
    const teamCodeMap = new Map(bootstrap.teams.map(t => [t.id, t.code]));
    const teamShortMap = new Map(bootstrap.teams.map(t => [t.id, t.short_name]));

    // Which teams have finished their match this matchday
    const teamFinishedMap = new Map<number, boolean>();
    const finishedFixtures = (fixturesData as any[]).filter(
      f => f.finished || f.finished_provisional
    );
    finishedFixtures.forEach(f => {
      teamFinishedMap.set(f.team_h, true);
      teamFinishedMap.set(f.team_a, true);
    });

    const players = picksData.picks.map((pick: any) => {
      const player: any = elementsMap.get(pick.element) || {};
      const live: any = liveMap.get(pick.element) || { total_points: 0, minutes: 0 };
      const posName = elementTypesMap.get(player.element_type) || 'UNK';

      return {
        id: pick.element,
        name: player.web_name || 'Unknown',
        position: posName,
        official_pos: pick.position,
        multiplier: pick.multiplier,
        live_points: live.total_points || 0,
        bps: live.bps || 0,
        bonus: live.bonus || 0,
        is_captain: pick.is_captain,
        is_vice_captain: pick.is_vice_captain,
        minutes: live.minutes || 0,
        status: player.status || 'a',
        price: (player.now_cost || 0) / 10,
        is_finished: teamFinishedMap.get(player.team) ?? false,
        was_started: pick.position <= 11,
        photo: player.code ? String(player.code) : null,
        teamCode: teamCodeMap.get(player.team),
        nation: teamShortMap.get(player.team) || '',
      };
    });

    // Auto-sub projection
    const starters = players.filter((p: any) => p.was_started);
    const bench    = players.filter((p: any) => !p.was_started);
    const missingStarters = starters.filter((p: any) => p.minutes === 0 && p.is_finished);

    let subPoints = 0;
    const availableBench = [...bench];
    missingStarters.forEach(() => {
      const idx = availableBench.findIndex((p: any) => p.minutes > 0 || !p.is_finished);
      if (idx !== -1) {
        subPoints += availableBench[idx].live_points;
        availableBench.splice(idx, 1);
      }
    });

    const projectedPoints =
      starters.reduce((acc: number, p: any) => {
        if (missingStarters.find((m: any) => m.id === p.id)) return acc;
        return acc + p.live_points * (p.multiplier || 1);
      }, 0) + subPoints;

    // Status lifecycle
    let status: 'live' | 'provisional' | 'official' = 'live';
    const eventMeta = bootstrap.events.find(e => e.id === matchday);
    if (eventMeta?.finished && eventMeta?.data_checked) {
      status = 'official';
    } else {
      const allDone =
        (fixturesData as any[]).length > 0 &&
        (fixturesData as any[]).every(f => f.finished || f.finished_provisional);
      if (allDone) status = 'provisional';
    }

    return NextResponse.json({ matchday, status, players, projected_points: projectedPoints });
  } catch (error) {
    console.error('Squad Live Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
