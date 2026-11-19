import type { Position } from './types';

export interface ReplayPlayer {
  id: number;
  name: string;
  position: Position;
  points: number;
  appeared: boolean;
}

interface ReplayPlan {
  startingEleven: number[];
  bench: number[];
  captainId: number;
  viceCaptainId: number;
  transferHit: number;
  chip?: string | null;
}

function legalFormation(lineup: ReplayPlayer[]) {
  const counts = [0, 0, 0, 0, 0];
  for (const player of lineup) counts[player.position]++;
  return counts[1] === 1 && counts[2] >= 3 && counts[2] <= 5
    && counts[3] >= 2 && counts[3] <= 5 && counts[4] >= 1 && counts[4] <= 3;
}

function findSubstitutions(lineup: ReplayPlayer[], bench: ReplayPlayer[], index = 0): {
  priority: number;
  substitutions: Array<{ outgoing: string; incoming: string; points: number }>;
} {
  const incoming = bench[index];
  if (!incoming) return { priority: 0, substitutions: [] };
  let best = findSubstitutions(lineup, bench, index + 1);
  for (const [slot, outgoing] of lineup.entries()) {
    if (outgoing.appeared || (outgoing.position === 1) !== (incoming.position === 1)) continue;
    const next = lineup.with(slot, incoming);
    if (!legalFormation(next)) continue;
    const remaining = findSubstitutions(next, bench, index + 1);
    const priority = remaining.priority + 2 ** (bench.length - index - 1);
    if (priority > best.priority) {
      best = {
        priority,
        substitutions: [{ outgoing: outgoing.name, incoming: incoming.name, points: incoming.points }, ...remaining.substitutions],
      };
    }
  }
  return best;
}

export function replayPlan(plan: ReplayPlan, players: ReplayPlayer[]) {
  const byId = new Map(players.map(player => [player.id, player]));
  const starters = plan.startingEleven.map(id => byId.get(id)).filter(player => player !== undefined);
  const bench = plan.bench.map(id => byId.get(id)).filter(player => player !== undefined);
  if (starters.length !== 11 || bench.length !== 4 || new Set([...starters, ...bench].map(player => player.id)).size !== 15
    || !legalFormation(starters) || !starters.some(player => player.id === plan.captainId)
    || !starters.some(player => player.id === plan.viceCaptainId) || plan.captainId === plan.viceCaptainId) {
    throw new Error('Incomplete or illegal recorded lineup');
  }

  const benchBoost = plan.chip === 'bboost';
  const substitutions = benchBoost ? [] : findSubstitutions(starters, bench.filter(player => player.appeared)).substitutions;
  const captain = byId.get(plan.captainId);
  const vice = byId.get(plan.viceCaptainId);
  const scorer = captain?.appeared ? captain : vice?.appeared ? vice : undefined;
  const captainBonus = (scorer?.points ?? 0) * (plan.chip === '3xc' ? 2 : 1);
  const startersPoints = starters.reduce((sum, player) => sum + (player.appeared ? player.points : 0), 0);
  const benchPoints = benchBoost
    ? bench.reduce((sum, player) => sum + player.points, 0)
    : substitutions.reduce((sum, swap) => sum + swap.points, 0);
  const gross = startersPoints + benchPoints + captainBonus;
  return {
    gross,
    net: gross - plan.transferHit,
    transferHit: plan.transferHit,
    startersPoints,
    benchPoints,
    substitutions,
    captainBonus,
    captainScorer: scorer?.name ?? null,
    captainFallback: Boolean(scorer && scorer.id === plan.viceCaptainId),
    chip: plan.chip ?? null,
  };
}
