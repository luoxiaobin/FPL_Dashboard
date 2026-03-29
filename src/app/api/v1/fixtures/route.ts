import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const entryId = req.cookies.get('fpl_entry_id')?.value;
    if (!entryId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch bootstrap (players, teams, fixtures)
    const [bootstrapRes, fixturesRes] = await Promise.all([
      fetch('https://fantasy.premierleague.com/api/bootstrap-static/', { headers: { 'User-Agent': 'Mozilla/5.0' } }),
      fetch('https://fantasy.premierleague.com/api/fixtures/', { headers: { 'User-Agent': 'Mozilla/5.0' } }),
    ]);

    if (!bootstrapRes.ok || !fixturesRes.ok) throw new Error('Failed to fetch FPL data');
    const bootstrap = await bootstrapRes.json();
    const allFixtures = await fixturesRes.json();

    // Find current GW
    const currentGW = bootstrap.events.find((e: any) => e.is_current) ||
                      bootstrap.events.find((e: any) => e.is_next);
    if (!currentGW) return NextResponse.json({ error: 'No active gameweek' }, { status: 404 });

    // Build team lookup (id -> name, short_name)
    const teamMap = new Map(bootstrap.teams.map((t: any) => [t.id, { name: t.name, short: t.short_name }]));

    // Get next 5 GWs of upcoming fixtures grouped by team
    const nextGWs = [currentGW.id, currentGW.id + 1, currentGW.id + 2, currentGW.id + 3, currentGW.id + 4].filter(gw => gw <= 38);
    const upcomingFixtures = allFixtures.filter((f: any) => nextGWs.includes(f.event) && !f.finished);

    // Group fixtures by team: teamId -> [{gw, opponent, difficulty, home}]
    const fixturesByTeam = new Map<number, Array<{ gw: number; opponent: string; difficulty: number; home: boolean }>>();
    for (const fix of upcomingFixtures) {
      const homeTeam = fix.team_h;
      const awayTeam = fix.team_a;
      if (!fixturesByTeam.has(homeTeam)) fixturesByTeam.set(homeTeam, []);
      if (!fixturesByTeam.has(awayTeam)) fixturesByTeam.set(awayTeam, []);
      const awayInfo: any = teamMap.get(awayTeam);
      const homeInfo: any = teamMap.get(homeTeam);
      fixturesByTeam.get(homeTeam)?.push({ gw: fix.event, opponent: awayInfo?.short || '?', difficulty: fix.team_h_difficulty, home: true });
      fixturesByTeam.get(awayTeam)?.push({ gw: fix.event, opponent: homeInfo?.short || '?', difficulty: fix.team_a_difficulty, home: false });
    }

    // Get user's current squad picks
    const picksRes = await fetch(`https://fantasy.premierleague.com/api/entry/${entryId}/event/${currentGW.id}/picks/`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (!picksRes.ok) throw new Error('Failed to fetch picks');
    const picksData = await picksRes.json();

    const elementsMap = new Map(bootstrap.elements.map((el: any) => [el.id, el]));

    const players = picksData.picks.slice(0, 15).map((pick: any) => {
      const el: any = elementsMap.get(pick.element) || {};
      const fixtures = fixturesByTeam.get(el.team) || [];
      const sortedFix = [...fixtures].sort((a, b) => a.gw - b.gw).slice(0, 5);

      return {
        id: pick.element,
        name: el.web_name || 'Unknown',
        team: (teamMap.get(el.team) as any)?.short || '?',
        position: pick.position,
        fixtures: sortedFix,
      };
    });

    return NextResponse.json({ gameweek: currentGW.id, players, nextGWs });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
