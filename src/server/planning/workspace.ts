import 'server-only';
import { fetchFplJson } from '@/server/fpl/client';
import { projectPlayer } from '@/server/projections/model';
import { generatePlanningScenarios } from '@/server/scenarios/generator';
import type { PlanningConstraints, Position } from '@/server/planning/types';

interface BootstrapEvent {
  id: number;
  is_current: boolean;
  is_next: boolean;
  finished: boolean;
  deadline_time: string;
}

interface BootstrapPlayer {
  id: number;
  web_name: string;
  team: number;
  element_type: number;
  now_cost: number;
  form: string;
  ep_next: string;
  status: string;
  chance_of_playing_next_round: number | null;
}

interface BootstrapPayload {
  events: BootstrapEvent[];
  elements: BootstrapPlayer[];
}

interface FixturePayload {
  event: number | null;
  team_h: number;
  team_a: number;
  team_h_difficulty: number;
  team_a_difficulty: number;
}

interface PicksPayload {
  picks: Array<{ element: number; selling_price: number }>;
  entry_history?: { bank?: number };
}

const asPosition = (value: number): Position => {
  if (value < 1 || value > 4) throw new Error(`Unsupported FPL position: ${value}`);
  return value as Position;
};

export async function buildPlanningWorkspace(entryId: number, constraints: PlanningConstraints) {
  const capturedAt = new Date();
  const [bootstrap, fixtures] = await Promise.all([
    fetchFplJson<BootstrapPayload>('/api/bootstrap-static/', { cacheSeconds: 300 }),
    fetchFplJson<FixturePayload[]>('/api/fixtures/', { cacheSeconds: 300 }),
  ]);
  const activeEvent = bootstrap.events.find(event => event.is_current)
    ?? bootstrap.events.find(event => event.is_next)
    ?? bootstrap.events[0];
  if (!activeEvent) throw new Error('FPL has no available Gameweek');

  const picks = await fetchFplJson<PicksPayload>(
    `/api/entry/${entryId}/event/${activeEvent.id}/picks/`,
    { timeoutMs: 8_000 },
  );
  if (!Array.isArray(picks.picks) || picks.picks.length !== 15) {
    throw new Error('The FPL squad is not available for planning yet');
  }

  const gameweeks = bootstrap.events
    .filter(event => event.id >= activeEvent.id)
    .slice(0, 5)
    .map(event => event.id);
  const fixturesByTeam = new Map<number, Array<{ gameweek: number; difficulty: number }>>();
  for (const fixture of fixtures) {
    if (fixture.event === null || !gameweeks.includes(fixture.event)) continue;
    const home = fixturesByTeam.get(fixture.team_h) ?? [];
    home.push({ gameweek: fixture.event, difficulty: fixture.team_h_difficulty });
    fixturesByTeam.set(fixture.team_h, home);
    const away = fixturesByTeam.get(fixture.team_a) ?? [];
    away.push({ gameweek: fixture.event, difficulty: fixture.team_a_difficulty });
    fixturesByTeam.set(fixture.team_a, away);
  }

  const sellingPrices = new Map(picks.picks.map(pick => [pick.element, pick.selling_price / 10]));
  const squadIds = new Set(picks.picks.map(pick => pick.element));
  const projections = bootstrap.elements.map(player => projectPlayer({
    id: player.id,
    webName: player.web_name,
    teamId: player.team,
    position: asPosition(player.element_type),
    price: player.now_cost / 10,
    sellingPrice: sellingPrices.get(player.id),
    form: Number.parseFloat(player.form) || 0,
    officialExpectedNext: Number.parseFloat(player.ep_next) || 0,
    status: player.status,
    chanceOfPlayingNextRound: player.chance_of_playing_next_round,
  }, fixturesByTeam.get(player.team) ?? [], gameweeks));

  const squad = projections.filter(player => squadIds.has(player.id));
  const candidates = projections.filter(player => !squadIds.has(player.id));
  const scenarios = generatePlanningScenarios(
    squad,
    candidates,
    (picks.entry_history?.bank ?? 0) / 10,
    constraints,
  );

  return {
    gameweek: activeEvent.id,
    deadline: activeEvent.deadline_time,
    horizonGameweeks: gameweeks,
    capturedAt: capturedAt.toISOString(),
    freshUntil: new Date(capturedAt.getTime() + 5 * 60_000).toISOString(),
    sourceVersion: `${activeEvent.id}:${capturedAt.toISOString().slice(0, 16)}`,
    scenarios,
    players: Object.fromEntries(projections.map(player => [player.id, {
      id: player.id,
      name: player.name,
      position: player.position,
      teamId: player.teamId,
      price: player.price,
      expectedTotal: player.expectedTotal,
      floor: player.floor,
      ceiling: player.ceiling,
      uncertainty: player.uncertainty,
    }])),
  };
}

