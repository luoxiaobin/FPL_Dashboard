export type Position = 1 | 2 | 3 | 4;
export type ScenarioStrategy = 'floor' | 'balanced' | 'upside';

export interface PlayerProjection {
  id: number;
  name: string;
  teamId: number;
  position: Position;
  price: number;
  sellingPrice: number;
  expectedByGameweek: number[];
  expectedTotal: number;
  floor: number;
  ceiling: number;
  uncertainty: number;
  startProbability: number;
}

export interface PlanningConstraints {
  lockedPlayerIds: number[];
  excludedPlayerIds: number[];
  maxPointsHit: number;
  bankReserve: number;
}

export interface PlanningTransfer {
  outPlayerId: number;
  inPlayerId: number;
  cost: number;
  expectedGain: number;
}

export type ScoringChip = 'bboost' | '3xc';
export interface ChipAdvice {
  expiresGameweek: number;
  deadline: string | null;
  activeChip: string | null;
  throughGameweek: number;
  recommendation: ScoringChip | null;
  options: Array<{
    chip: ScoringChip;
    used: boolean;
    currentPoints: number;
    best: { gameweek: number; points: number };
    later: { gameweek: number; points: number } | null;
  }>;
}

export interface PlanningScenario {
  scenarioId?: string;
  strategy: ScenarioStrategy;
  label: string;
  transfers: PlanningTransfer[];
  transferHit: number;
  squad: number[];
  startingEleven: number[];
  bench: number[];
  captainId: number;
  viceCaptainId: number;
  chip: null;
  chipAdvice?: ChipAdvice;
  bankRemaining: number;
  projectedGameweekPoints: number;
  projectedFiveGameweekPoints: number;
  versusHold?: {
    gameweekPoints: number;
    horizonPoints: number;
    gameweekGain: number;
    horizonGain: number;
    horizonGameweeks: number;
  };
  uncertainty: number;
  tradeoff: string;
  modelVersion: string;
}

export const DEFAULT_PLANNING_CONSTRAINTS: PlanningConstraints = {
  lockedPlayerIds: [],
  excludedPlayerIds: [],
  maxPointsHit: 0,
  bankReserve: 0,
};
