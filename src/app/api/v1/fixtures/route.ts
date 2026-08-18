import { NextRequest, NextResponse } from 'next/server';
import { buildClubFormMap } from '@/lib/clubForm';
import { getEntryIdFromSession } from '@/lib/session';
import { fplFetch, toSafeId } from '@/lib/upstreamFetch';
import { resolveRelevantGameweek, squadUnpublishedPayload } from '@/lib/fplAvailability';

export async function GET(req: NextRequest) {
  try {
    const rawEntryId = await getEntryIdFromSession(req);
    if (!rawEntryId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const entryId = toSafeId(rawEntryId, 'entryId');

    // Fetch bootstrap (players, teams, fixtures)
    const [bootstrapRes, fixturesRes] = await Promise.all([
      fplFetch('/api/bootstrap-static/', { headers: { 'User-Agent': 'Mozilla/5.0' } }),
      fplFetch('/api/fixtures/', { headers: { 'User-Agent': 'Mozilla/5.0' } }),
    ]);

    if (!bootstrapRes.ok || !fixturesRes.ok) throw new Error('Failed to fetch FPL data');
    const bootstrap = await bootstrapRes.json();
    const allFixtures = await fixturesRes.json();

    // Find current GW
    const currentGWData = resolveRelevantGameweek(bootstrap.events);
    if (!currentGWData) return NextResponse.json({ error: 'No active gameweek' }, { status: 404 });

    const currentGW = currentGWData.id;
    // Sync: If current is finished, start ticker from the next one
    const targetGW = (currentGWData.finished && currentGW < 38) ? currentGW + 1 : currentGW;

    // Build team lookup (id -> name, short_name)
    const teamMap = new Map(bootstrap.teams.map((t: any) => [t.id, { name: t.name, short: t.short_name }]));

    // Get next 5 GWs starting from targetGW
    const nextGWs = [targetGW, targetGW + 1, targetGW + 2, targetGW + 3, targetGW + 4].filter(gw => gw <= 38);
    const upcomingFixtures = allFixtures.filter((f: any) => nextGWs.includes(f.event) && (!f.finished && !f.finished_provisional));

    // Group fixtures by team: teamId -> [{gw, opponent, difficulty, home}]
    const fixturesByTeam = new Map<number, Array<{ gw: number; opponent: string; difficulty: number; home: boolean; isDGW?: boolean; secondaryOpponent?: string }>>();

    // Count matches per team per event to detect DGW
    const matchCount = new Map<string, number>(); // "teamId-event" -> count
    upcomingFixtures.forEach((f: any) => {
      const keyH = `${f.team_h}-${f.event}`;
      const keyA = `${f.team_a}-${f.event}`;
      matchCount.set(keyH, (matchCount.get(keyH) || 0) + 1);
      matchCount.set(keyA, (matchCount.get(keyA) || 0) + 1);
    });

    for (const fix of upcomingFixtures) {
      const homeTeam = fix.team_h;
      const awayTeam = fix.team_a;
      if (!fixturesByTeam.has(homeTeam)) fixturesByTeam.set(homeTeam, []);
      if (!fixturesByTeam.has(awayTeam)) fixturesByTeam.set(awayTeam, []);

      const awayInfo: any = teamMap.get(awayTeam);
      const homeInfo: any = teamMap.get(homeTeam);

      const homeIsDGW = matchCount.get(`${homeTeam}-${fix.event}`)! > 1;
      const awayIsDGW = matchCount.get(`${awayTeam}-${fix.event}`)! > 1;

      // For DGW, we might push two entries or one with a flag.
      // The current ticker expects one cell per GW, so let's handle DGW by flagging it.
      fixturesByTeam.get(homeTeam)?.push({
        gw: fix.event,
        opponent: awayInfo?.short || '?',
        difficulty: fix.team_h_difficulty,
        home: true,
        isDGW: homeIsDGW
      });
      fixturesByTeam.get(awayTeam)?.push({
        gw: fix.event,
        opponent: homeInfo?.short || '?',
        difficulty: fix.team_a_difficulty,
        home: false,
        isDGW: awayIsDGW
      });
    }

    // Get user's current squad picks
    const picksRes = await fplFetch(`/api/entry/${entryId}/event/${toSafeId(currentGW, 'gameweek')}/picks/`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (picksRes.status === 404 && currentGWData.is_next) {
      return NextResponse.json({
        ...squadUnpublishedPayload(currentGWData),
        players: [],
        nextGWs,
      });
    }
    if (!picksRes.ok) throw new Error(`Failed to fetch picks (${picksRes.status})`);
    const picksData = await picksRes.json();

    const elementsMap = new Map(bootstrap.elements.map((el: any) => [el.id, el]));
    const elementTypes = new Map(bootstrap.element_types.map((et: any) => [et.id, et.singular_name_short]));

    const finishedFixtures = allFixtures.filter((f: any) => f.finished || f.finished_provisional);
    const clubFormMap = buildClubFormMap(finishedFixtures, bootstrap.teams as Array<{ id: number }>);

    const players = picksData.picks.slice(0, 15).map((pick: any) => {
      const el: any = elementsMap.get(pick.element) || {};
      const fixtures = fixturesByTeam.get(el.team) || [];
      const team = bootstrap.teams.find((t: any) => t.id === el.team);
      const sortedFix = [...fixtures].sort((a: any, b: any) => a.gw - b.gw).slice(0, 5);

      return {
        id: pick.element,
        name: el.web_name || 'Unknown',
        photo: el.code ? String(el.code) : el.photo?.replace('.jpg', ''),
        teamCode: team?.code,
        club: team?.name || '?',
        teamShort: team?.short_name || '?',
        teamForm: el.form,
        clubForm: clubFormMap.get(el.team) || '',
        role: elementTypes.get(el.element_type) || '?',
        status: el.news || null,
        chance: el.chance_of_playing_next_round,
        position: pick.position,
        fixtures: sortedFix,
      };
    });

    return NextResponse.json({ gameweek: targetGW, players, nextGWs });

  } catch (error: unknown) {
    console.error('Fixtures Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
