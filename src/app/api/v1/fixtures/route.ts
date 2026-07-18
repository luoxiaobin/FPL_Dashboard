import { NextRequest, NextResponse } from 'next/server';
import { buildClubFormMap } from '@/lib/clubForm';
import { FplApiError, getBootstrap, getFixtures, getPicks } from '@/lib/fpl/client';
import { resolveGameweekContext } from '@/lib/fpl/gameweekContext';

export async function GET(req: NextRequest) {
  try {
    const entryId = req.cookies.get('fpl_entry_id')?.value;
    if (!entryId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch the season contract through the shared FPL boundary.
    const [bootstrap, allFixtures] = await Promise.all([getBootstrap(), getFixtures()]);

    const context = resolveGameweekContext(bootstrap.events);
    const targetGW = context.planningGW;
    const picksGW = context.picksGW;
    if (!targetGW || !picksGW) {
      return NextResponse.json({
        error: 'FPL fixture planning data is not available yet.',
        code: context.state,
        season: context.seasonCode,
        planning_gameweek: targetGW,
      }, { status: 409 });
    }

    // Build team lookup (id -> name, short_name)
    const teamMap = new Map(bootstrap.teams.map((t: any) => [t.id, { name: t.name, short: t.short_name }]));

    // Get next 5 GWs starting from targetGW
    const eventIds = bootstrap.events.map(event => event.id);
    const nextGWs = eventIds.filter(gw => gw >= targetGW).slice(0, 5);
    const upcomingFixtures = (allFixtures as any[]).filter((f: any) => nextGWs.includes(f.event) && (!f.finished && !f.finished_provisional));

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

    // Get the latest public squad picks; preseason/deadline gaps are explicit.
    const picksData = await getPicks(entryId, picksGW);

    const elementsMap = new Map(bootstrap.elements.map((el: any) => [el.id, el]));
    const elementTypes = new Map(bootstrap.element_types.map((et: any) => [et.id, et.singular_name_short]));

    const finishedFixtures = (allFixtures as any[]).filter((f: any) => f.finished || f.finished_provisional);
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
    if (error instanceof FplApiError) {
      const status = error.code === 'picks_unavailable' ? 409 : error.status;
      return NextResponse.json({ error: error.message, code: error.code, path: error.path }, { status });
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
