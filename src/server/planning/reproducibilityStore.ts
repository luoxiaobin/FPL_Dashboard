import 'server-only';
import { createHash } from 'node:crypto';
import { supabaseAdmin } from '@/lib/supabase';
import type { PlanningConstraints, PlanningScenario } from '@/server/planning/types';
import { fetchFplJson } from '@/server/fpl/client';

export interface PlanningSourceRecord {
  capturedAt: string;
  freshUntil: string;
  deadline: string;
  gameweek: number;
  horizonGameweeks: number;
  bootstrap: unknown;
  fixtures: unknown;
  entryPayload: unknown;
  picksPayload: unknown;
  transfersPayload: unknown;
  players: unknown;
}

const canonicalJson = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
};

const digest = (value: unknown) => createHash('sha256')
  .update(canonicalJson(value))
  .digest('hex');

export function seasonIdentity(deadline: string) {
  const date = new Date(deadline);
  const year = date.getUTCFullYear();
  const startYear = date.getUTCMonth() >= 6 ? year : year - 1;
  return {
    code: `${startYear}-${String(startYear + 1).slice(-2)}`,
    startsOn: `${startYear}-07-01`,
    endsOn: `${startYear + 1}-06-30`,
  };
}

export async function checkPlanningReproducibilityStore(): Promise<boolean> {
  const checks = await Promise.all([
    supabaseAdmin.from('fpl_snapshots').select('id', { head: true }).limit(1),
    supabaseAdmin.from('entry_snapshots').select('id, source_version', { head: true }).limit(1),
    supabaseAdmin.from('planning_scenarios').select('id', { head: true }).limit(1),
    supabaseAdmin.from('plan_selections').select('id', { head: true }).limit(1),
  ]);
  return checks.every(check => !check.error);
}

async function requireRow<T>(operation: PromiseLike<{ data: T | null; error: { message: string } | null }>, label: string) {
  const { data, error } = await operation;
  if (error || !data) throw new Error(`${label}: ${error?.message ?? 'no row returned'}`);
  return data;
}

export async function persistPlanningRun(
  entryId: number,
  source: PlanningSourceRecord,
  constraints: PlanningConstraints,
  scenarios: PlanningScenario[],
): Promise<Map<string, string>> {
  const season = seasonIdentity(source.deadline);
  const seasonRow = await requireRow<{ id: string }>(supabaseAdmin
    .from('seasons')
    .upsert({
      code: season.code,
      starts_on: season.startsOn,
      ends_on: season.endsOn,
      is_current: true,
    }, { onConflict: 'code' })
    .select('id')
    .single(), 'Unable to persist season');

  const globalVersion = digest({ bootstrap: source.bootstrap, fixtures: source.fixtures });
  const { error: globalInsertError } = await supabaseAdmin
    .from('fpl_snapshots')
    .upsert({
      season_id: seasonRow.id,
      captured_at: source.capturedAt,
      fresh_until: source.freshUntil,
      source_version: globalVersion,
      bootstrap: source.bootstrap,
      fixtures: source.fixtures,
    }, { onConflict: 'season_id,source_version', ignoreDuplicates: true });
  if (globalInsertError) throw new Error(`Unable to persist FPL snapshot: ${globalInsertError.message}`);
  const globalSnapshot = await requireRow<{ id: string }>(supabaseAdmin
    .from('fpl_snapshots')
    .select('id')
    .eq('season_id', seasonRow.id)
    .eq('source_version', globalVersion)
    .single(), 'Unable to persist FPL snapshot');

  const entryVersion = digest({
    gameweek: source.gameweek,
    entry: source.entryPayload,
    picks: source.picksPayload,
    transfers: source.transfersPayload,
  });
  const { error: entryInsertError } = await supabaseAdmin
    .from('entry_snapshots')
    .upsert({
      fpl_snapshot_id: globalSnapshot.id,
      fpl_entry_id: entryId,
      gameweek_id: source.gameweek,
      captured_at: source.capturedAt,
      fresh_until: source.freshUntil,
      source_version: entryVersion,
      entry_payload: source.entryPayload,
      picks_payload: source.picksPayload,
      transfers_payload: source.transfersPayload,
    }, { onConflict: 'fpl_snapshot_id,fpl_entry_id,gameweek_id,source_version', ignoreDuplicates: true });
  if (entryInsertError) throw new Error(`Unable to persist entry snapshot: ${entryInsertError.message}`);
  const entrySnapshot = await requireRow<{ id: string }>(supabaseAdmin
    .from('entry_snapshots')
    .select('id')
    .eq('fpl_snapshot_id', globalSnapshot.id)
    .eq('fpl_entry_id', entryId)
    .eq('gameweek_id', source.gameweek)
    .eq('source_version', entryVersion)
    .single(), 'Unable to persist entry snapshot');

  const rows = scenarios.map(scenario => ({
    entry_snapshot_id: entrySnapshot.id,
    strategy: scenario.strategy,
    horizon_gameweeks: source.horizonGameweeks,
    model_version: scenario.modelVersion,
    constraints,
    projections: {
      players: source.players,
      projectedGameweekPoints: scenario.projectedGameweekPoints,
      projectedFiveGameweekPoints: scenario.projectedFiveGameweekPoints,
      uncertainty: scenario.uncertainty,
    },
    decisions: { ...scenario, gameweek: source.gameweek, deadline: source.deadline },
  }));
  const { error: scenarioInsertError } = await supabaseAdmin
    .from('planning_scenarios')
    .upsert(rows, {
      onConflict: 'entry_snapshot_id,strategy,model_version,constraints',
      ignoreDuplicates: true,
    });
  if (scenarioInsertError) throw new Error(`Unable to persist planning scenarios: ${scenarioInsertError.message}`);
  const { data: persisted, error: scenarioReadError } = await supabaseAdmin
    .from('planning_scenarios')
    .select('id, strategy, model_version, constraints')
    .eq('entry_snapshot_id', entrySnapshot.id);
  if (scenarioReadError) throw new Error(`Unable to load planning scenarios: ${scenarioReadError.message}`);
  const matching = (persisted ?? []).filter(row => (
    scenarios.some(scenario => scenario.strategy === row.strategy && scenario.modelVersion === row.model_version)
    && canonicalJson(row.constraints) === canonicalJson(constraints)
  ));
  if (matching.length !== scenarios.length) throw new Error('Unable to resolve every persisted planning scenario');

  return new Map(matching.map(row => [row.strategy, row.id]));
}

export interface StoredMyPlan {
  id: string;
  scenarioId: string;
  gameweek: number;
  strategy: string;
  selectedAt: string;
  frozenAt: string | null;
  decisions: Record<string, unknown>;
  outcome: Record<string, unknown> | null;
}

interface FinalizedPicks {
  picks: Array<{ element: number; is_captain: boolean; multiplier: number }>;
  entry_history?: {
    points?: number;
    total_points?: number;
    event_transfers_cost?: number;
    points_on_bench?: number;
  };
}

interface LiveGameweek {
  elements: Array<{ id: number; stats: { total_points?: number } }>;
}

export function evaluatePlanOutcome(
  decisions: Record<string, unknown>,
  actual: FinalizedPicks,
  live: LiveGameweek,
) {
  const points = new Map(live.elements.map(player => [player.id, Number(player.stats.total_points) || 0]));
  const startingEleven = Array.isArray(decisions.startingEleven)
    ? decisions.startingEleven.filter((id): id is number => Number.isInteger(id))
    : [];
  const captainId = Number(decisions.captainId);
  const plannedRawPoints = startingEleven.reduce((total, id) => total + (points.get(id) ?? 0), 0)
    + (points.get(captainId) ?? 0);
  const actualCaptain = actual.picks.find(pick => pick.is_captain)?.element ?? null;
  const actualSquad = actual.picks.map(pick => pick.element);
  const plannedSquad = Array.isArray(decisions.squad)
    ? decisions.squad.filter((id): id is number => Number.isInteger(id))
    : [];
  const projectedPoints = Number(decisions.projectedGameweekPoints) || 0;
  const actualPoints = Number(actual.entry_history?.points) || 0;

  return {
    evaluatedAt: new Date().toISOString(),
    projectedPoints,
    actualPoints,
    projectionError: actualPoints - projectedPoints,
    transferCost: Number(actual.entry_history?.event_transfers_cost) || 0,
    pointsOnBench: Number(actual.entry_history?.points_on_bench) || 0,
    plannedRawPointsBeforeAutosubs: plannedRawPoints,
    plannedCaptainId: Number.isInteger(captainId) ? captainId : null,
    actualCaptainId: actualCaptain,
    captainMatched: Number.isInteger(captainId) && captainId === actualCaptain,
    squadMatched: plannedSquad.length === 15
      && plannedSquad.every(id => actualSquad.includes(id)),
    actualSquad,
  };
}

async function refreshMyPlanLifecycle(plan: StoredMyPlan, entryId: number): Promise<StoredMyPlan> {
  const deadline = Date.parse(String(plan.decisions.deadline ?? ''));
  if (!Number.isFinite(deadline) || Date.now() < deadline) return plan;

  const frozenAt = plan.frozenAt ?? new Date(deadline).toISOString();
  let outcome = plan.outcome;
  if (!outcome) {
    const bootstrap = await fetchFplJson<{ events: Array<{ id: number; finished: boolean; data_checked: boolean }> }>(
      '/api/bootstrap-static/',
      { cacheSeconds: 300 },
    );
    const event = bootstrap.events.find(candidate => candidate.id === plan.gameweek);
    if (event?.finished && event.data_checked) {
      const [actual, live] = await Promise.all([
        fetchFplJson<FinalizedPicks>(`/api/entry/${entryId}/event/${plan.gameweek}/picks/`),
        fetchFplJson<LiveGameweek>(`/api/event/${plan.gameweek}/live/`, { cacheSeconds: 3600 }),
      ]);
      outcome = evaluatePlanOutcome(plan.decisions, actual, live);
    }
  }

  if (frozenAt !== plan.frozenAt || outcome !== plan.outcome) {
    const { error } = await supabaseAdmin
      .from('plan_selections')
      .update({ frozen_at: frozenAt, outcome })
      .eq('id', plan.id)
      .eq('fpl_entry_id', entryId);
    if (error) throw new Error(`Unable to update My Plan lifecycle: ${error.message}`);
  }
  return { ...plan, frozenAt, outcome };
}

export async function saveMyPlan(entryId: number, scenarioId: string): Promise<StoredMyPlan> {
  const scenario = await requireRow<{
    id: string;
    entry_snapshot_id: string;
    strategy: string;
    decisions: Record<string, unknown>;
  }>(supabaseAdmin
    .from('planning_scenarios')
    .select('id, entry_snapshot_id, strategy, decisions')
    .eq('id', scenarioId)
    .single(), 'Unable to load planning scenario');
  const snapshot = await requireRow<{ fpl_entry_id: number; gameweek_id: number }>(supabaseAdmin
    .from('entry_snapshots')
    .select('fpl_entry_id, gameweek_id')
    .eq('id', scenario.entry_snapshot_id)
    .single(), 'Unable to validate planning scenario');
  if (Number(snapshot.fpl_entry_id) !== entryId) throw new Error('Planning scenario belongs to a different FPL entry');

  const now = new Date();
  const deadline = Date.parse(String(scenario.decisions.deadline ?? ''));
  if (!Number.isFinite(deadline)) throw new Error('Planning scenario has no valid deadline');
  if (now.getTime() >= deadline) throw new Error('Planning deadline has passed');
  const selected = await requireRow<{
    id: string;
    scenario_id: string;
    selected_at: string;
    frozen_at: string | null;
    selected_decisions: Record<string, unknown>;
    outcome: Record<string, unknown> | null;
  }>(supabaseAdmin
    .from('plan_selections')
    .insert({
      scenario_id: scenario.id,
      fpl_entry_id: entryId,
      selected_decisions: scenario.decisions,
      selected_at: now.toISOString(),
      frozen_at: null,
    })
    .select('id, scenario_id, selected_at, frozen_at, selected_decisions, outcome')
    .single(), 'Unable to save My Plan');

  return {
    id: selected.id,
    scenarioId: selected.scenario_id,
    gameweek: snapshot.gameweek_id,
    strategy: scenario.strategy,
    selectedAt: selected.selected_at,
    frozenAt: selected.frozen_at,
    decisions: selected.selected_decisions,
    outcome: selected.outcome,
  };
}

export async function loadLatestMyPlan(entryId: number, gameweek?: number): Promise<StoredMyPlan | null> {
  const { data, error } = await supabaseAdmin
    .from('plan_selections')
    .select('id, scenario_id, selected_at, frozen_at, selected_decisions, outcome')
    .eq('fpl_entry_id', entryId)
    .order('selected_at', { ascending: false })
    .limit(10);
  if (error) throw new Error(`Unable to load My Plan: ${error.message}`);
  for (const selection of data ?? []) {
    const scenario = await requireRow<{ entry_snapshot_id: string; strategy: string }>(supabaseAdmin
      .from('planning_scenarios')
      .select('entry_snapshot_id, strategy')
      .eq('id', selection.scenario_id)
      .single(), 'Unable to load selected scenario');
    const snapshot = await requireRow<{ gameweek_id: number }>(supabaseAdmin
      .from('entry_snapshots')
      .select('gameweek_id')
      .eq('id', scenario.entry_snapshot_id)
      .single(), 'Unable to load selected snapshot');
    if (gameweek !== undefined && snapshot.gameweek_id !== gameweek) continue;
    return refreshMyPlanLifecycle({
      id: selection.id,
      scenarioId: selection.scenario_id,
      gameweek: snapshot.gameweek_id,
      strategy: scenario.strategy,
      selectedAt: selection.selected_at,
      frozenAt: selection.frozen_at,
      decisions: selection.selected_decisions,
      outcome: selection.outcome,
    }, entryId);
  }
  return null;
}
