import { NextRequest, NextResponse } from 'next/server';
import { FplApiError, getBootstrap, getElementSummary, getEntryHistory, getEntryTransfers, getFixtures } from '@/lib/fpl/client';
import { resolveGameweekContext } from '@/lib/fpl/gameweekContext';

export async function GET(req: NextRequest) {
  try {
    const entryId = req.cookies.get('fpl_entry_id')?.value;
    if (!entryId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [transfers, history] = await Promise.all([
      getEntryTransfers<Array<Record<string, any>>>(entryId),
      getEntryHistory<Record<string, any>>(entryId),
    ]);
    
    const chipsMap = new Map(history.chips?.map((c: any) => [c.event, c.name]));
    const hitsMap = new Map(history.current?.map((h: any) => [h.event, h.event_transfers_cost]));

    const [bootstrap, allFixtures] = await Promise.all([getBootstrap(), getFixtures()]);
    const context = resolveGameweekContext(bootstrap.events);
    
    const playersMap = new Map(bootstrap.elements.map((p: any) => [p.id, p]));
    const teamMap = new Map(bootstrap.teams.map((t: any) => [t.id, { name: t.name, short: t.short_name }]));
    
    // Find the next planning rounds from the live bootstrap, without a hard-coded GW limit.
    const targetGW = context.planningGW ?? context.currentGW ?? 1;
    const nextGWs = bootstrap.events.map(event => event.id).filter(gw => gw >= targetGW).slice(0, 4);

    // Group fixtures by team
    const fixturesByTeam = new Map<number, any[]>();
    for (const fix of (allFixtures as any[])) {
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
        summaryCache.set(playerId, await getElementSummary(playerId));
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
        photoIn: pIn?.code ? String(pIn.code) : pIn?.photo?.replace('.jpg', ''),
        photoOut: pOut?.code ? String(pOut.code) : pOut?.photo?.replace('.jpg', ''),
        teamCodeIn: (teamMap.get(pIn?.team) as any)?.code,
        teamCodeOut: (teamMap.get(pOut?.team) as any)?.code,
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
      season: context.seasonCode,
      season_state: context.state,
    });

  } catch (error: any) {
    if (error instanceof FplApiError) {
      return NextResponse.json({ error: error.message, code: error.code, path: error.path }, { status: error.status });
    }
    console.error('Transfer Analyser Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
