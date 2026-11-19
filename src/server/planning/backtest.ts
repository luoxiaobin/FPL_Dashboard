import 'server-only';
import { supabaseAdmin } from '@/lib/supabase';
import { fetchFplJson } from '@/server/fpl/client';
import { replayPlan, type ReplayPlayer } from './replay';
import { seasonIdentity } from './reproducibilityStore';
import { DEFAULT_PLANNING_CONSTRAINTS, type PlanningScenario, type Position } from './types';

interface Event {
  id: number;
  finished: boolean;
  data_checked: boolean;
  deadline_time: string;
}

interface StoredScenario {
  created_at: string;
  decisions: PlanningScenario;
  projections: { players: Record<string, { name: string; position: Position }> };
  entry_snapshots: { transfers_payload: { transferCost?: number; activeChip?: string } | null };
}

interface LiveElement {
  id: number;
  stats: { total_points: number; minutes: number; yellow_cards?: number; red_cards?: number };
}

export async function loadLatestBacktest(entryId: string) {
  const bootstrap = await fetchFplJson<{ events: Event[] }>('/api/bootstrap-static/');
  const event = bootstrap.events.filter(item => item.finished && item.data_checked)
    .sort((a, b) => b.id - a.id)[0];
  if (!event) return { status: 'no_finalized_gameweek' as const };
  const gameweek = event.id;

  const { data, error } = await supabaseAdmin.from('planning_scenarios')
    .select('created_at, decisions, projections, entry_snapshots!inner(transfers_payload, fpl_snapshots!inner(seasons!inner(code)))')
    .eq('entry_snapshots.fpl_entry_id', entryId)
    .eq('entry_snapshots.gameweek_id', gameweek)
    .eq('entry_snapshots.fpl_snapshots.seasons.code', seasonIdentity(event.deadline_time).code)
    .eq('strategy', 'balanced')
    .eq('constraints', JSON.stringify(DEFAULT_PLANNING_CONSTRAINTS))
    .lt('created_at', event.deadline_time)
    .lt('entry_snapshots.captured_at', event.deadline_time)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
    .returns<StoredScenario | null>();
  if (error) throw new Error('Unable to read recorded Planning recommendations');
  if (!data) return { status: 'no_recommendation' as const, gameweek };

  const [actual, live] = await Promise.all([
    fetchFplJson<{ entry_history: { points: number; event_transfers_cost: number }; active_chip?: string | null }>(
      `/api/entry/${entryId}/event/${gameweek}/picks/`, { cacheSeconds: 3600 },
    ),
    fetchFplJson<{ elements: LiveElement[] }>(`/api/event/${gameweek}/live/`, { cacheSeconds: 3600 }),
  ]);
  const actualGross = actual.entry_history?.points;
  const actualHit = actual.entry_history?.event_transfers_cost;
  if (!Number.isFinite(actualGross) || !Number.isFinite(actualHit)) throw new Error('Finalized manager score is unavailable');

  const plannedPlayers = data.projections.players;
  const official = new Map(live.elements.map(player => [player.id, player.stats]));
  const players: ReplayPlayer[] = data.decisions.squad.flatMap(id => {
    const recorded = plannedPlayers[id];
    const stats = official.get(id);
    if (!recorded || !stats || !Number.isFinite(stats.total_points) || !Number.isFinite(stats.minutes)) return [];
    return [{
      id, name: recorded.name, position: recorded.position, points: stats.total_points,
      appeared: stats.minutes > 0 || Number(stats.yellow_cards) > 0 || Number(stats.red_cards) > 0,
    }];
  });
  if (players.length !== 15) return { status: 'incomplete_results' as const, gameweek };
  const alreadyPaid = data.entry_snapshots.transfers_payload?.transferCost ?? 0;
  const replayInput = {
    ...data.decisions,
    transferHit: data.decisions.transferHit + alreadyPaid,
    chip: data.decisions.chip ?? data.entry_snapshots.transfers_payload?.activeChip,
  };
  const planned = replayPlan(replayInput, players);
  const advisedChip = data.decisions.chipAdvice?.recommendation;
  const chipComparison = advisedChip && !replayInput.chip ? (() => {
    const withChip = replayPlan({ ...replayInput, chip: advisedChip }, players).net;
    return { chip: advisedChip, withoutChip: planned.net, withChip, gain: withChip - planned.net };
  })() : null;
  const actualNet = actualGross - actualHit;
  return {
    status: 'ready' as const,
    gameweek,
    recordedAt: data.created_at,
    actual: { gross: actualGross, net: actualNet, transferHit: actualHit, chip: actual.active_chip ?? null },
    planned,
    chipComparison,
    difference: planned.net - actualNet,
    grossDifference: planned.gross - actualGross,
    transferHitDifference: actualHit - planned.transferHit,
  };
}
