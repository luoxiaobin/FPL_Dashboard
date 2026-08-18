import {
  type PlanningConstraints,
  type PlanningScenario,
  type PlayerProjection,
  type Position,
  type ScenarioStrategy,
} from '@/server/planning/types';
import { PROJECTION_MODEL_VERSION } from '@/server/projections/model';

const STRATEGIES: ScenarioStrategy[] = ['floor', 'balanced', 'upside'];

export interface PlanningTransferContext {
  freeTransfers: number;
  unlimited: boolean;
}

const DEFAULT_TRANSFER_CONTEXT: PlanningTransferContext = { freeTransfers: 1, unlimited: false };

const strategyScore = (player: PlayerProjection, strategy: ScenarioStrategy) => {
  if (strategy === 'floor') return player.floor;
  if (strategy === 'upside') return player.ceiling;
  return player.expectedTotal;
};

function chooseStartingEleven(players: PlayerProjection[], strategy: ScenarioStrategy) {
  const grouped = new Map<Position, PlayerProjection[]>();
  ([1, 2, 3, 4] as Position[]).forEach(position => {
    grouped.set(position, players
      .filter(player => player.position === position)
      .sort((a, b) => strategyScore(b, strategy) - strategyScore(a, strategy)));
  });

  let best: PlayerProjection[] = [];
  let bestScore = -Infinity;
  for (let defenders = 3; defenders <= 5; defenders += 1) {
    for (let midfielders = 2; midfielders <= 5; midfielders += 1) {
      const forwards = 10 - defenders - midfielders;
      if (forwards < 1 || forwards > 3) continue;
      const candidate = [
        ...(grouped.get(1)?.slice(0, 1) ?? []),
        ...(grouped.get(2)?.slice(0, defenders) ?? []),
        ...(grouped.get(3)?.slice(0, midfielders) ?? []),
        ...(grouped.get(4)?.slice(0, forwards) ?? []),
      ];
      if (candidate.length !== 11) continue;
      const score = candidate.reduce((sum, player) => sum + strategyScore(player, strategy), 0);
      if (score > bestScore) {
        best = candidate;
        bestScore = score;
      }
    }
  }
  if (best.length !== 11) throw new Error('Unable to construct a legal starting formation');
  return best;
}

function respectsClubLimit(squad: PlayerProjection[]): boolean {
  const counts = new Map<number, number>();
  for (const player of squad) {
    const count = (counts.get(player.teamId) ?? 0) + 1;
    if (count > 3) return false;
    counts.set(player.teamId, count);
  }
  return true;
}

function bestSingleTransfer(
  squad: PlayerProjection[],
  candidates: PlayerProjection[],
  bank: number,
  constraints: PlanningConstraints,
  strategy: ScenarioStrategy,
) {
  let best: { out: PlayerProjection; incoming: PlayerProjection; gain: number } | null = null;
  for (const outgoing of squad) {
    if (constraints.lockedPlayerIds.includes(outgoing.id)) continue;
    for (const incoming of candidates) {
      if (incoming.position !== outgoing.position) continue;
      if (constraints.excludedPlayerIds.includes(incoming.id)) continue;
      if (squad.some(player => player.id === incoming.id)) continue;
      if (incoming.price > bank + outgoing.sellingPrice - constraints.bankReserve) continue;
      const nextSquad = squad.map(player => player.id === outgoing.id ? incoming : player);
      if (!respectsClubLimit(nextSquad)) continue;
      const gain = strategyScore(incoming, strategy) - strategyScore(outgoing, strategy);
      if (!best || gain > best.gain) best = { out: outgoing, incoming, gain };
    }
  }
  return best && best.gain > 0 ? best : null;
}

function buildScenario(
  initialSquad: PlayerProjection[],
  candidates: PlayerProjection[],
  bank: number,
  constraints: PlanningConstraints,
  strategy: ScenarioStrategy,
  transferContext: PlanningTransferContext,
): PlanningScenario {
  let squad = [...initialSquad];
  let bankRemaining = bank;
  const transfers: Array<{ out: PlayerProjection; incoming: PlayerProjection; gain: number }> = [];
  const maxTransfers = Math.min(5, transferContext.unlimited
    ? 5
    : transferContext.freeTransfers + Math.floor(constraints.maxPointsHit / 4));
  for (let transferIndex = 0; transferIndex < maxTransfers; transferIndex += 1) {
    const transfer = bestSingleTransfer(squad, candidates, bankRemaining, constraints, strategy);
    if (!transfer || (transferIndex > 0 && transfer.gain <= 4)) break;
    squad = squad.map(player => player.id === transfer.out.id ? transfer.incoming : player);
    bankRemaining += transfer.out.sellingPrice - transfer.incoming.price;
    transfers.push(transfer);
  }
  const transferHit = transferContext.unlimited
    ? 0
    : Math.max(0, transfers.length - transferContext.freeTransfers) * 4;
  const starters = chooseStartingEleven(squad, strategy);
  const starterIds = new Set(starters.map(player => player.id));
  const bench = squad
    .filter(player => !starterIds.has(player.id))
    .sort((a, b) => {
      if (a.position === 1) return 1;
      if (b.position === 1) return -1;
      return strategyScore(b, strategy) - strategyScore(a, strategy);
    });
  const captaincy = [...starters].sort((a, b) => strategyScore(b, strategy) - strategyScore(a, strategy));
  const captain = captaincy[0];
  const viceCaptain = captaincy[1];
  const gameweekStrategyScore = (player: PlayerProjection) => {
    const expected = player.expectedByGameweek[0] ?? 0;
    if (player.expectedTotal <= 0) return expected;
    return expected * (strategyScore(player, strategy) / player.expectedTotal);
  };
  const projectedGameweekPoints = starters.reduce(
    (sum, player) => sum + gameweekStrategyScore(player),
    gameweekStrategyScore(captain),
  ) - transferHit;
  const projectedFiveGameweekPoints = starters.reduce(
    (sum, player) => sum + strategyScore(player, strategy),
    strategyScore(captain, strategy),
  ) - transferHit;

  const labels = { floor: 'Floor', balanced: 'Balanced', upside: 'Upside' };
  const tradeoffs = {
    floor: 'Prioritizes availability and dependable minutes over maximum ceiling.',
    balanced: 'Maximizes the base five-Gameweek projection under current assumptions.',
    upside: 'Accepts greater outcome variance in exchange for a higher projected ceiling.',
  };

  return {
    strategy,
    label: labels[strategy],
    transfers: transfers.map(transfer => ({
      outPlayerId: transfer.out.id,
      inPlayerId: transfer.incoming.id,
      cost: Number((transfer.incoming.price - transfer.out.sellingPrice).toFixed(1)),
      expectedGain: Number(transfer.gain.toFixed(2)),
    })),
    transferHit,
    squad: squad.map(player => player.id),
    startingEleven: starters.map(player => player.id),
    bench: bench.map(player => player.id),
    captainId: captain.id,
    viceCaptainId: viceCaptain.id,
    chip: null,
    bankRemaining: Number(bankRemaining.toFixed(1)),
    projectedGameweekPoints: Number(projectedGameweekPoints.toFixed(2)),
    projectedFiveGameweekPoints: Number(projectedFiveGameweekPoints.toFixed(2)),
    uncertainty: Number((starters.reduce((sum, player) => sum + player.uncertainty, 0) / 11).toFixed(2)),
    tradeoff: tradeoffs[strategy],
    modelVersion: PROJECTION_MODEL_VERSION,
  };
}

export function generatePlanningScenarios(
  squad: PlayerProjection[],
  candidates: PlayerProjection[],
  bank: number,
  constraints: PlanningConstraints,
  transferContext: PlanningTransferContext = DEFAULT_TRANSFER_CONTEXT,
): PlanningScenario[] {
  if (squad.length !== 15) throw new Error('A planning squad must contain exactly 15 players');
  if (!respectsClubLimit(squad)) throw new Error('The source squad violates the three-player club limit');
  return STRATEGIES.map(strategy => buildScenario(squad, candidates, bank, constraints, strategy, transferContext));
}
