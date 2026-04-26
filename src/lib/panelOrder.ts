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

export function extractPanelOrders(raw: unknown): {
  planningOrder: string[];
  liveOrder: string[];
} {
  const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    planningOrder: Array.isArray(obj.planning_panel_order) ? (obj.planning_panel_order as string[]) : [],
    liveOrder: Array.isArray(obj.live_panel_order) ? (obj.live_panel_order as string[]) : [],
  };
}

export function buildPanelOrderPayload(
  prefs: Record<string, unknown>,
  planningOrder: string[] = [],
  liveOrder: string[] = []
): Record<string, unknown> {
  return { ...prefs, planning_panel_order: planningOrder, live_panel_order: liveOrder };
}

export function moveItem<T>(arr: T[], index: number, direction: 'up' | 'down'): T[] {
  const next = [...arr];
  if (direction === 'up' && index > 0) {
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
  } else if (direction === 'down' && index < arr.length - 1) {
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
  }
  return next;
}
