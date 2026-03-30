import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const entryId = req.cookies.get('fpl_entry_id')?.value;
    if (!entryId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch Transfer History, Chips, and Entry History
    const [transRes, historyRes] = await Promise.all([
      fetch(`https://fantasy.premierleague.com/api/entry/${entryId}/transfers/`, { headers: { 'User-Agent': 'Mozilla/5.0' } }),
      fetch(`https://fantasy.premierleague.com/api/entry/${entryId}/history/`, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    ]);

    if (!transRes.ok || !historyRes.ok) throw new Error('Failed to fetch FPL history');
    const transfers = await transRes.json();
    const history = await historyRes.json();
    
    const chipsMap = new Map(history.chips?.map((c: any) => [c.event, c.name]));
    const hitsMap = new Map(history.current?.map((h: any) => [h.event, h.event_transfers_cost]));

    // 2. Fetch Bootstrap and Fixtures
    const [bootstrapRes, fixturesRes] = await Promise.all([
      fetch('https://fantasy.premierleague.com/api/bootstrap-static/', { headers: { 'User-Agent': 'Mozilla/5.0' } }),
      fetch('https://fantasy.premierleague.com/api/fixtures/', { headers: { 'User-Agent': 'Mozilla/5.0' } })
    ]);
    const [bootstrap, allFixtures] = await Promise.all([bootstrapRes.json(), fixturesRes.json()]);
    
    const playersMap = new Map(bootstrap.elements.map((p: any) => [p.id, p]));
    const teamMap = new Map(bootstrap.teams.map((t: any) => [t.id, { name: t.name, short: t.short_name }]));
    
    // Find next GWs for fixture ticker
    const currentGW = bootstrap.events.find((e: any) => e.is_current)?.id || 1;
    const nextGWs = [currentGW, currentGW + 1, currentGW + 2, currentGW + 3].filter(gw => gw <= 38);

    // Group fixtures by team
    const fixturesByTeam = new Map<number, any[]>();
    for (const fix of allFixtures) {
      if (!fix.event || !nextGWs.includes(fix.event)) continue;
      
      const homeTeam = fix.team_h;
      const awayTeam = fix.team_a;
      
      if (!fixturesByTeam.has(homeTeam)) fixturesByTeam.set(homeTeam, []);
      if (!fixturesByTeam.has(awayTeam)) fixturesByTeam.set(awayTeam, []);
      
      const homeInfo = teamMap.get(homeTeam) as any;
      const awayInfo = teamMap.get(awayTeam) as any;
      
      fixturesByTeam.get(homeTeam)?.push({ gw: fix.event, opponent: awayInfo?.short, difficulty: fix.team_h_difficulty, home: true });
      fixturesByTeam.get(awayTeam)?.push({ gw: fix.event, opponent: homeInfo?.short, difficulty: fix.team_a_difficulty, home: false });
    }

    // 3. Cache for player summaries to avoid redundant API calls
    const summaryCache = new Map<number, any>();

    const getPlayerPointsInGW = async (playerId: number, gw: number) => {
      if (!summaryCache.has(playerId)) {
        const res = await fetch(`https://fantasy.premierleague.com/api/element-summary/${playerId}/`, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        if (res.ok) summaryCache.set(playerId, await res.json());
      }
      const summary = summaryCache.get(playerId);
      const gwData = summary?.history?.find((h: any) => h.round === gw);
      return gwData?.total_points ?? 0;
    };

    // 4. Process transfers mapping both historical performance and upcoming fixtures
    const processedTransfers = await Promise.all(transfers.map(async (t: any) => {
      const pIn = playersMap.get(t.element_in) as any;
      const pOut = playersMap.get(t.element_out) as any;

      const [pointsIn, pointsOut] = await Promise.all([
        getPlayerPointsInGW(t.element_in, t.event),
        getPlayerPointsInGW(t.element_out, t.event)
      ]);

      const getFix = (tag: number) => (fixturesByTeam.get(tag) || []).sort((a, b) => a.gw - b.gw).slice(0, 3);
      
      return {
        id: `${t.entry}-${t.time}`,
        gw: t.event,
        time: t.time,
        playerIn: pIn?.web_name || 'Unknown',
        playerOut: pOut?.web_name || 'Unknown',
        costIn: t.element_in_cost / 10,
        costOut: t.element_out_cost / 10,
        pointsIn,
        pointsOut,
        pointsImpact: pointsIn - pointsOut,
        chip: chipsMap.get(t.event) || null,
        hitCost: hitsMap.get(t.event) || 0,
        fixturesIn: getFix(pIn?.team),
        fixturesOut: getFix(pOut?.team)
      };
    }));

    return NextResponse.json({
      transfers: processedTransfers.reverse(), // Latest first
      totalTransfers: transfers.length,
    });

  } catch (error: any) {
    console.error('Transfer Analyser Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
