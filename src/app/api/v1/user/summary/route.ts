import { NextRequest, NextResponse } from 'next/server';
import { getEntryIdFromSession } from '@/lib/session';
import { toSafeId } from '@/lib/upstreamFetch';
import { fetchFplJson } from '@/server/fpl/client';

interface EntrySummary {
  id: number;
  player_first_name?: string;
  player_last_name?: string;
  name: string;
  current_event?: number;
  summary_overall_rank?: number;
  summary_overall_points?: number;
  last_deadline_bank?: number;
  last_deadline_value?: number;
  last_deadline_total_transfers?: number;
}

interface EntryHistory {
  chips?: Array<{ event: number; name: string }>;
  current: Array<{ overall_rank: number }>;
}

interface BootstrapSummary {
  total_players?: number;
  events: Array<{ id: number; is_current: boolean; finished: boolean }>;
}

export async function GET(req: NextRequest) {
  try {
    const rawEntryId = await getEntryIdFromSession(req);
    if (!rawEntryId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const entryId = toSafeId(rawEntryId, 'entryId');

    const [data, history, bootstrap] = await Promise.all([
      fetchFplJson<EntrySummary>(`/api/entry/${entryId}/`),
      fetchFplJson<EntryHistory>(`/api/entry/${entryId}/history/`),
      fetchFplJson<BootstrapSummary>('/api/bootstrap-static/', { cacheSeconds: 300 }),
    ]);

    // Determine current phase (GW 1-19 or GW 20-38)
    const currentGW = data.current_event || 0;
    const isSecondHalf = currentGW >= 20;
    const phaseStart = isSecondHalf ? 20 : 1;
    const phaseEnd = isSecondHalf ? 38 : 19;

    // Standard FPL chip names
    const allChips = ['bboost', '3xc', 'wildcard', 'freehit'];

    // Filter used chips to only those used in the CURRENT phase
    const usedInPhase = new Set<string>(
      (history.chips || [])
        .filter(c => c.event >= phaseStart && c.event <= phaseEnd)
        .map(c => c.name)
    );

    const availableChips = allChips.filter(c => !usedInPhase.has(c));

    // Calculate Trend (compare current rank vs 3 GWs ago)
    const currentGWs = history.current;
    let trend = 'Stable';
    if (currentGWs.length >= 4) {
      const now = currentGWs[currentGWs.length - 1].overall_rank;
      const then = currentGWs[currentGWs.length - 4].overall_rank;
      if (now < then * 0.95) trend = 'Improving';
      else if (now > then * 1.05) trend = 'Declining';
    }

    const currentEvent = bootstrap.events.find(event => event.is_current);
    const currentEventStatus = currentEvent && !currentEvent.finished ? 'live' : 'planning';

    return NextResponse.json({
      user_id: data.id,
      manager_name: `${data.player_first_name || ''} ${data.player_last_name || ''}`.trim(),
      team_name: data.name,
      overall_rank: data.summary_overall_rank || 0,
      total_points: data.summary_overall_points || 0,
      total_players: bootstrap.total_players || 11000000,
      bank_balance: (data.last_deadline_bank || 0) / 10,
      total_value: ((data.last_deadline_value || 0) + (data.last_deadline_bank || 0)) / 10,
      available_chips: availableChips,
      trend: trend,
      transfers_available: data.last_deadline_total_transfers || 0,
      current_event_status: currentEventStatus,
    });
  } catch (error) {
    console.error('User Summary Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
