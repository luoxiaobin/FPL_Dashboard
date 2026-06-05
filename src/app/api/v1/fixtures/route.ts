import { NextRequest, NextResponse } from 'next/server';
import { getBootstrap, fifaFetch } from '@/lib/fifaApi';

// Difficulty proxy: use FIFA/Elo ranking bracket → 1-5 scale
function teamStrengthToDifficulty(fifaRanking: number): number {
  if (fifaRanking <= 5)  return 5;
  if (fifaRanking <= 15) return 4;
  if (fifaRanking <= 30) return 3;
  if (fifaRanking <= 50) return 2;
  return 1;
}

export async function GET(req: NextRequest) {
  try {
    const entryId = req.cookies.get('fpl_entry_id')?.value;
    if (!entryId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [bootstrap, allFixtures] = await Promise.all([
      getBootstrap(),
      fifaFetch('/fixtures/'),
    ]);

    const currentEvent =
      bootstrap.events.find(e => e.is_current) ||
      bootstrap.events.find(e => e.is_next);
    if (!currentEvent) return NextResponse.json({ error: 'No active matchday' }, { status: 404 });

    const currentMD = currentEvent.id;
    const targetMD = currentEvent.finished && currentMD < bootstrap.events.length
      ? currentMD + 1
      : currentMD;

    const teamMap = new Map(bootstrap.teams.map(t => [t.id, { name: t.name, short: t.short_name }]));

    // Next 5 matchdays/rounds from targetMD
    const nextEvents = bootstrap.events
      .filter(e => e.id >= targetMD)
      .slice(0, 5)
      .map(e => e.id);

    const upcoming = (allFixtures as any[]).filter(
      f => nextEvents.includes(f.event) && !f.finished && !f.finished_provisional
    );

    const fixturesByTeam = new Map<number, any[]>();
    const matchCount = new Map<string, number>();

    upcoming.forEach((f: any) => {
      const kH = `${f.team_h}-${f.event}`;
      const kA = `${f.team_a}-${f.event}`;
      matchCount.set(kH, (matchCount.get(kH) || 0) + 1);
      matchCount.set(kA, (matchCount.get(kA) || 0) + 1);
    });

    for (const fix of upcoming) {
      const { team_h, team_a, event } = fix;
      if (!fixturesByTeam.has(team_h)) fixturesByTeam.set(team_h, []);
      if (!fixturesByTeam.has(team_a)) fixturesByTeam.set(team_a, []);

      const awayInfo: any = teamMap.get(team_a);
      const homeInfo: any = teamMap.get(team_h);
      const hDiff = teamStrengthToDifficulty(fix.team_h_difficulty ?? 3);
      const aDiff = teamStrengthToDifficulty(fix.team_a_difficulty ?? 3);

      fixturesByTeam.get(team_h)!.push({
        md: event, opponent: awayInfo?.short || '?', difficulty: hDiff, home: true,
        isDGW: (matchCount.get(`${team_h}-${event}`) ?? 0) > 1,
      });
      fixturesByTeam.get(team_a)!.push({
        md: event, opponent: homeInfo?.short || '?', difficulty: aDiff, home: false,
        isDGW: (matchCount.get(`${team_a}-${event}`) ?? 0) > 1,
      });
    }

    // User's squad
    const picksData = await fifaFetch(`/entry/${entryId}/event/${currentMD}/picks/`);
    const elementsMap = new Map(bootstrap.elements.map(el => [el.id, el]));
    const elementTypes = new Map(bootstrap.element_types.map(et => [et.id, et.singular_name_short]));

    const players = picksData.picks.slice(0, 15).map((pick: any) => {
      const el: any = elementsMap.get(pick.element) || {};
      const team = bootstrap.teams.find(t => t.id === el.team);
      const fixtures = (fixturesByTeam.get(el.team) || [])
        .sort((a: any, b: any) => a.md - b.md)
        .slice(0, 5);

      return {
        id: pick.element,
        name: el.web_name || 'Unknown',
        photo: el.code ? String(el.code) : null,
        teamCode: team?.code,
        club: team?.name || '?',
        teamShort: team?.short_name || '?',
        teamForm: el.form,
        role: elementTypes.get(el.element_type) || '?',
        status: el.news || null,
        chance: el.chance_of_playing_next_round,
        position: pick.position,
        fixtures,
      };
    });

    return NextResponse.json({ matchday: targetMD, players, nextEvents });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
