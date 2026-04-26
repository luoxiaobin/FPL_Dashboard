export const ALL_PANEL_KEYS = [
  'syncStatus',
  'livePoints',
  'squadPitch',
  'captaincyAdviser',
  'transferOptimizer',
  'transferAnalyser',
  'rankProjection',
  'leagueStandings',
  'leagueLive',
  'historyChart',
  'gameweekHistory',
  'fixtureTicker',
  'rivalCompare',
] as const;

export type PanelKey = (typeof ALL_PANEL_KEYS)[number];

export const PLANNING_DEFAULT_ORDER: PanelKey[] = [
  'syncStatus',
  'transferOptimizer',
  'captaincyAdviser',
  'transferAnalyser',
  'rankProjection',
  'leagueStandings',
  'historyChart',
  'gameweekHistory',
  'fixtureTicker',
  'squadPitch',
  'livePoints',
  'leagueLive',
  'rivalCompare',
];

export const LIVE_DEFAULT_ORDER: PanelKey[] = [
  'syncStatus',
  'livePoints',
  'squadPitch',
  'leagueLive',
  'captaincyAdviser',
  'rankProjection',
  'leagueStandings',
  'fixtureTicker',
  'transferOptimizer',
  'transferAnalyser',
  'historyChart',
  'gameweekHistory',
  'rivalCompare',
];

export function mergeOrder(saved: string[], defaults: PanelKey[]): PanelKey[] {
  const valid = saved.filter((k): k is PanelKey =>
    (ALL_PANEL_KEYS as readonly string[]).includes(k)
  );
  const missing = defaults.filter((k) => !valid.includes(k));
  return [...valid, ...missing];
}
