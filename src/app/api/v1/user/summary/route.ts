import { NextRequest, NextResponse } from 'next/server';
import { FplApiError, getBootstrap, getEntry, getEntryHistory } from '@/lib/fpl/client';
import { resolveGameweekContext } from '@/lib/fpl/gameweekContext';

export async function GET(req: NextRequest) {
  try {
    const entryId = req.cookies.get('fpl_entry_id')?.value;

    if (!entryId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [data, history] = await Promise.all([
      getEntry<Record<string, any>>(entryId),
      getEntryHistory<Record<string, any>>(entryId),
    ]);

    // Determine current phase (GW 1-19 or GW 20-38)
    const bootstrap = await getBootstrap();
    const context = resolveGameweekContext(bootstrap.events);
    const currentGW = context.currentGW ?? context.planningGW ?? data.current_event ?? 0;
    const isSecondHalf = currentGW >= 20;
    const phaseStart = isSecondHalf ? 20 : 1;
    const phaseEnd = isSecondHalf ? 38 : 19;

    // Standard FPL chip names
    const allChips = ['bboost', '3xc', 'wildcard', 'freehit'];
    
    // Filter used chips to only those used in the CURRENT phase
    const usedInPhase = new Set<string>(
      (history.chips as Array<{ event: number; name: string }> || [])
        .filter(c => c.event >= phaseStart && c.event <= phaseEnd)
        .map(c => c.name)
    );

    const availableChips = allChips.filter(c => !usedInPhase.has(c));

    // Calculate Trend (compare current rank vs 3 GWs ago)
    const currentGWs = (history.current as Array<{ overall_rank: number }> | undefined) || [];
    let trend = 'Stable';
    if (currentGWs.length >= 4) {
      const now = currentGWs[currentGWs.length - 1].overall_rank;
      const then = currentGWs[currentGWs.length - 4].overall_rank;
      if (now < then * 0.95) trend = 'Improving';
      else if (now > then * 1.05) trend = 'Declining';
    }

    return NextResponse.json({
      user_id: data.id,
      manager_name: `${data.player_first_name || ''} ${data.player_last_name || ''}`.trim(),
      team_name: data.name,
      overall_rank: data.summary_overall_rank || 0,
      total_points: data.summary_overall_points || 0,
      total_players: bootstrap.total_players || 11000000,
      bank_balance: (data.last_deadline_bank || 0) / 10,
      total_value: (data.last_deadline_value + (data.last_deadline_bank || 0)) / 10,
      available_chips: availableChips,
      trend: trend,
      transfers_available: data.last_deadline_total_transfers || 0,
      season: context.seasonCode,
      season_state: context.state,
      current_gameweek: context.currentGW,
      planning_gameweek: context.planningGW
    });
  } catch (error) {
    if (error instanceof FplApiError) {
      return NextResponse.json({ error: error.message, code: error.code, path: error.path }, { status: error.status });
    }
    console.error('User Summary Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
