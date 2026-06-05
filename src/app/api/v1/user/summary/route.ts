import { NextRequest, NextResponse } from 'next/server';
import { fifaFetch, getBootstrap, FIFA_BOOSTERS, type FifaBooster } from '@/lib/fifaApi';

export async function GET(req: NextRequest) {
  try {
    const entryId = req.cookies.get('fpl_entry_id')?.value;
    if (!entryId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [entryData, historyData, bootstrap] = await Promise.all([
      fifaFetch(`/entry/${entryId}/`),
      fifaFetch(`/entry/${entryId}/history/`),
      getBootstrap(),
    ]);

    const currentMD = entryData.current_event || 0;
    const phase = currentMD <= 3 ? 'group' : 'knockout';

    // Boosters used in the current phase
    const usedBoosters = new Set<string>(
      (historyData.chips as Array<{ event: number; name: string }> || [])
        .filter(c => phase === 'group' ? c.event <= 3 : c.event > 3)
        .map(c => c.name)
    );

    const availableBoosters = (FIFA_BOOSTERS as readonly FifaBooster[]).filter(b => !usedBoosters.has(b));

    // Trend: compare overall rank vs 3 matchdays ago
    const history = historyData.current || [];
    let trend = 'Stable';
    if (history.length >= 4) {
      const now  = history[history.length - 1].overall_rank;
      const then = history[history.length - 4].overall_rank;
      if (now < then * 0.95) trend = 'Improving';
      else if (now > then * 1.05) trend = 'Declining';
    }

    return NextResponse.json({
      user_id: entryData.id,
      manager_name: `${entryData.player_first_name || ''} ${entryData.player_last_name || ''}`.trim(),
      team_name: entryData.name,
      overall_rank: entryData.summary_overall_rank || 0,
      total_points: entryData.summary_overall_points || 0,
      total_players: bootstrap.total_players || 2000000,
      bank_balance: (entryData.last_deadline_bank || 0) / 10,
      total_value: (entryData.last_deadline_value + (entryData.last_deadline_bank || 0)) / 10,
      available_boosters: availableBoosters,
      trend,
      transfers_available: entryData.last_deadline_total_transfers || 0,
      current_event_status: entryData.current_event_status,
      current_matchday: currentMD,
      phase,
    });
  } catch (error) {
    console.error('User Summary Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
