export const SECTION_KEYS = [
  'captaincyAdviser',
  'rankProjection',
  'historyChart',
  'gameweekHistory',
  'fixtureTicker',
  'transferAnalyser',
  'squadPitch',
  'livePoints',
  'leagueStandings',
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];
export type SectionPreferences = Record<SectionKey, boolean>;

export const DEFAULT_SECTION_PREFERENCES: SectionPreferences = {
  captaincyAdviser: true,
  rankProjection: true,
  historyChart: true,
  gameweekHistory: true,
  fixtureTicker: true,
  transferAnalyser: true,
  squadPitch: true,
  livePoints: true,
  leagueStandings: true,
};

export const SECTION_LABELS: Record<SectionKey, string> = {
  captaincyAdviser: 'Captaincy Adviser',
  rankProjection: 'Rank Projection',
  historyChart: 'Season History Chart',
  gameweekHistory: 'Gameweek History',
  fixtureTicker: 'Fixture Ticker',
  transferAnalyser: 'Transfer Analyser',
  squadPitch: 'Live Squad Pitch',
  livePoints: 'Live Points',
  leagueStandings: 'League Standings',
};

export const normalizeSectionPreferences = (input: unknown): SectionPreferences => {
  const source = input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
  const result: SectionPreferences = { ...DEFAULT_SECTION_PREFERENCES };

  for (const key of SECTION_KEYS) {
    if (typeof source[key] === 'boolean') {
      result[key] = source[key] as boolean;
    }
  }

  return result;
};
