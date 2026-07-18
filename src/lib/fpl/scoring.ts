export type FplPosition = 'GKP' | 'DEF' | 'MID' | 'FWD';

export interface ScoringPlayer {
  id: number;
  position: FplPosition;
  pickPosition: number;
  multiplier: number;
  isCaptain: boolean;
  isViceCaptain: boolean;
  points: number;
  minutes: number;
  fixtureFinished: boolean;
}

export interface AppliedSubstitution {
  out: number;
  in: number;
}

export interface ScoredPlayer extends ScoringPlayer {
  effectiveMultiplier: number;
  countedPoints: number;
  projectedIn: boolean;
  projectedOut: boolean;
}

export interface SquadScoreResult {
  total: number;
  grossTotal: number;
  transferCost: number;
  substitutions: AppliedSubstitution[];
  players: ScoredPlayer[];
}

const FORMATION_MINIMUMS: Record<Exclude<FplPosition, 'GKP'>, number> = {
  DEF: 3,
  MID: 2,
  FWD: 1,
};

const isNoShow = (player: ScoringPlayer) => player.fixtureFinished && player.minutes === 0;

const formationIsValid = (starters: ScoringPlayer[]) => {
  const counts = { DEF: 0, MID: 0, FWD: 0 };
  starters.forEach(player => {
    if (player.position !== 'GKP') counts[player.position] += 1;
  });
  return Object.entries(FORMATION_MINIMUMS).every(([position, minimum]) => counts[position as keyof typeof counts] >= minimum);
};

function chooseOutfieldSubs(starters: ScoringPlayer[], bench: ScoringPlayer[]): AppliedSubstitution[] {
  const missing = starters.filter(player => player.position !== 'GKP' && isNoShow(player));
  const candidates = bench.filter(player => player.position !== 'GKP' && !isNoShow(player));
  let best: AppliedSubstitution[] = [];
  let bestBenchIndexes: number[] = [];

  const isEarlier = (indexes: number[], current: number[]) => {
    for (let i = 0; i < Math.min(indexes.length, current.length); i += 1) {
      if (indexes[i] !== current[i]) return indexes[i] < current[i];
    }
    return indexes.length > current.length;
  };

  const visit = (
    candidateIndex: number,
    availableMissing: ScoringPlayer[],
    substitutions: AppliedSubstitution[],
    selectedBenchIndexes: number[],
  ) => {
    if (candidateIndex >= candidates.length || availableMissing.length === 0) {
      const substitutedOut = new Set(substitutions.map(sub => sub.out));
      const incoming = substitutions.map(sub => candidates.find(player => player.id === sub.in)!);
      const nominalStarters = starters.filter(player => !substitutedOut.has(player.id)).concat(incoming);
      if (!formationIsValid(nominalStarters)) return;

      if (
        substitutions.length > best.length ||
        (substitutions.length === best.length && isEarlier(selectedBenchIndexes, bestBenchIndexes))
      ) {
        best = [...substitutions];
        bestBenchIndexes = [...selectedBenchIndexes];
      }
      return;
    }

    visit(candidateIndex + 1, availableMissing, substitutions, selectedBenchIndexes);
    const candidate = candidates[candidateIndex];
    availableMissing.forEach((outPlayer, missingIndex) => {
      visit(
        candidateIndex + 1,
        availableMissing.filter((_, index) => index !== missingIndex),
        substitutions.concat({ out: outPlayer.id, in: candidate.id }),
        selectedBenchIndexes.concat(candidateIndex),
      );
    });
  };

  visit(0, missing, [], []);
  return best;
}

export function scoreSquad(
  squad: ScoringPlayer[],
  options: { activeChip?: string | null; transferCost?: number } = {},
): SquadScoreResult {
  const ordered = [...squad].sort((a, b) => a.pickPosition - b.pickPosition);
  const starters = ordered.filter(player => player.pickPosition <= 11);
  const bench = ordered.filter(player => player.pickPosition > 11);
  const substitutions: AppliedSubstitution[] = [];
  const benchBoost = options.activeChip === 'bboost';

  if (!benchBoost) {
    const missingGoalkeeper = starters.find(player => player.position === 'GKP' && isNoShow(player));
    const benchGoalkeeper = bench.find(player => player.position === 'GKP' && !isNoShow(player));
    if (missingGoalkeeper && benchGoalkeeper) {
      substitutions.push({ out: missingGoalkeeper.id, in: benchGoalkeeper.id });
    }
    substitutions.push(...chooseOutfieldSubs(starters, bench));
  }

  const subbedOut = new Set(substitutions.map(sub => sub.out));
  const subbedIn = new Set(substitutions.map(sub => sub.in));
  const captain = ordered.find(player => player.isCaptain);
  const viceCaptain = ordered.find(player => player.isViceCaptain);
  const captainMultiplier = Math.max(captain?.multiplier ?? 2, 2);
  const captainNoShow = captain ? isNoShow(captain) : false;
  const viceTakesCaptaincy = Boolean(captainNoShow && viceCaptain && !isNoShow(viceCaptain));

  const players = ordered.map<ScoredPlayer>(player => {
    const counted = benchBoost || (player.pickPosition <= 11 && !subbedOut.has(player.id)) || subbedIn.has(player.id);
    let effectiveMultiplier = counted ? 1 : 0;
    if (counted && player.isCaptain && !captainNoShow) effectiveMultiplier = captainMultiplier;
    if (counted && player.isViceCaptain && viceTakesCaptaincy) effectiveMultiplier = captainMultiplier;
    if (isNoShow(player)) effectiveMultiplier = 0;

    return {
      ...player,
      effectiveMultiplier,
      countedPoints: player.points * effectiveMultiplier,
      projectedIn: subbedIn.has(player.id),
      projectedOut: subbedOut.has(player.id),
    };
  });

  const grossTotal = players.reduce((total, player) => total + player.countedPoints, 0);
  const transferCost = options.transferCost ?? 0;
  return { total: grossTotal - transferCost, grossTotal, transferCost, substitutions, players };
}

