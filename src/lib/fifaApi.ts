/**
 * FIFA World Cup 2026 Fantasy API adapter.
 *
 * The official game lives at play.fifa.com/fantasy. Its REST API is not
 * publicly documented, but follows FPL-like conventions. Endpoints below
 * are derived from community reverse-engineering and are configured via
 * the FIFA_API_BASE env var so the base URL can be swapped without code
 * changes once confirmed.
 *
 * Fallback data sources (no API key required):
 *   - Fixtures/teams: https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/
 *   - Live scores:    API-Football (requires key, set FIFA_FOOTBALL_API_KEY)
 */

export const FIFA_API_BASE =
  process.env.FIFA_API_BASE ?? 'https://play.fifa.com/fantasy/en-GB/api';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36';

export async function fifaFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${FIFA_API_BASE}${path}`, {
    ...opts,
    headers: { 'User-Agent': UA, Accept: 'application/json', ...opts?.headers },
  });
  if (!res.ok) throw new Error(`FIFA API ${res.status}: ${path}`);
  return res.json();
}

// ── Tournament structure ──────────────────────────────────────────────────────

export interface FifaEvent {
  id: number;
  name: string;          // "Matchday 1", "Round of 32", etc.
  deadline_time: string; // ISO timestamp
  is_current: boolean;
  is_next: boolean;
  finished: boolean;
  data_checked: boolean;
  average_entry_score: number;
  phase: 'group' | 'knockout';
}

export interface FifaTeam {
  id: number;
  name: string;
  short_name: string;   // 3-letter code e.g. "BRA"
  code: number;         // used for badge/kit image URLs
  group: string;        // "A"–"L"
}

export interface FifaPlayer {
  id: number;
  web_name: string;
  first_name: string;
  second_name: string;
  element_type: number; // 1=GKP 2=DEF 3=MID 4=FWD
  team: number;
  now_cost: number;     // in tenths: 55 = $5.5m
  ep_next: string;
  form: string;
  status: string;       // "a" available, "i" injured, "s" suspended, "u" unavailable
  news: string;
  chance_of_playing_next_round: number | null;
  ict_index: string;
  selected_by_percent: string;
  total_points: number;
  event_points: number;
}

export interface FifaBootstrap {
  events: FifaEvent[];
  teams: FifaTeam[];
  elements: FifaPlayer[];
  element_types: Array<{ id: number; singular_name_short: string }>;
  total_players: number;
}

// ── User endpoints ────────────────────────────────────────────────────────────

export interface FifaUserEntry {
  id: number;
  player_first_name: string;
  player_last_name: string;
  name: string;             // team name
  summary_overall_rank: number;
  summary_overall_points: number;
  current_event: number;
  current_event_status: string;
  last_deadline_bank: number;
  last_deadline_value: number;
  last_deadline_total_transfers: number;
  leagues: {
    classic: Array<{
      id: number;
      name: string;
      rank: number;
      previous_rank: number;
      entry_rank: number;
      has_rank: boolean;
    }>;
  };
}

export interface FifaPick {
  element: number;
  position: number;
  multiplier: number;
  is_captain: boolean;
  is_vice_captain: boolean;
  selling_price: number;
}

export interface FifaPicksResponse {
  picks: FifaPick[];
  active_chip: string | null;
  entry_history: {
    event: number;
    points: number;
    total_points: number;
    rank: number;
    overall_rank: number;
    bank: number;
    value: number;
    event_transfers: number;
    event_transfers_cost: number;
    points_on_bench: number;
  };
}

export interface FifaLiveElement {
  id: number;
  stats: {
    minutes: number;
    total_points: number;
    goals_scored: number;
    assists: number;
    clean_sheets: number;
    goals_conceded: number;
    saves: number;
    yellow_cards: number;
    red_cards: number;
    bonus: number;
    bps: number;
  };
}

// ── Scoring reference (FIFA WC 2026) ─────────────────────────────────────────
// Source: play.fifa.com/fantasy/help/rules

export const FIFA_SCORING = {
  minutes_played_1_59: 1,
  minutes_played_60_plus: 2,
  goals_scored: { 1: 6, 2: 6, 3: 5, 4: 4 },   // by element_type
  assist: 3,
  clean_sheet: { 1: 4, 2: 4, 3: 1, 4: 0 },
  goals_conceded_per_2: -1,   // GKP/DEF only, floor(goals/2)
  saves_per_3: 1,              // GKP only, floor(saves/3)
  yellow_card: -1,
  red_card: -3,
  own_goal: -2,
  penalty_miss: -2,
  goal_outside_box_bonus: 1,
  freekick_goal_bonus: 1,
  low_ownership_bonus: 2,      // >4pts AND <5% selected
  tackles_per_3: 1,            // MID only
} as const;

// ── Booster names (FIFA equivalent of FPL chips) ──────────────────────────────

export const FIFA_BOOSTERS = ['wildcard', 'twelfth_man', 'max_captain', 'qualification_booster', 'mystery_booster'] as const;
export type FifaBooster = typeof FIFA_BOOSTERS[number];

export const FIFA_BOOSTER_LABELS: Record<FifaBooster, string> = {
  wildcard: 'Wildcard',
  twelfth_man: '12th Man',
  max_captain: 'Max Captain',
  qualification_booster: 'Qualification Booster',
  mystery_booster: 'Clean Sheet Shield',
};

// ── Position constants ────────────────────────────────────────────────────────

export const FIFA_POSITION_NAMES: Record<number, string> = {
  1: 'GKP',
  2: 'DEF',
  3: 'MID',
  4: 'FWD',
};

// Squad constraints: 2 GKP, 5 DEF, 5 MID, 3 FWD
export const FIFA_SQUAD_LIMITS: Record<string, number> = {
  GKP: 2, DEF: 5, MID: 5, FWD: 3,
};

// ── Image helpers ─────────────────────────────────────────────────────────────

const FLAG_BASE = 'https://play.fifa.com/football-worldcup-2026/utils/images/flags';
const KIT_BASE  = 'https://play.fifa.com/football-worldcup-2026/utils/images/kits';

export const getFifaNationFlagUrl = (teamCode: number) =>
  `${FLAG_BASE}/${teamCode}.png`;

export const getFifaPlayerKitUrl = (teamCode: number, size: 'sm' | 'lg' = 'lg') =>
  `${KIT_BASE}/${teamCode}_${size}.png`;

export const TRANSPARENT_GIF =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

// ── Bootstrap cache (15-min in-process, same as FPL pattern) ─────────────────

let _bootstrapCache: FifaBootstrap | null = null;
let _bootstrapTime = 0;
const CACHE_TTL = 900_000;

export async function getBootstrap(): Promise<FifaBootstrap> {
  const now = Date.now();
  if (_bootstrapCache && now - _bootstrapTime < CACHE_TTL) return _bootstrapCache;

  const data = await fifaFetch('/bootstrap-static/');
  _bootstrapCache = data as FifaBootstrap;
  _bootstrapTime = now;
  return _bootstrapCache;
}

// ── Matchday phase helpers ────────────────────────────────────────────────────

export function getEventPhase(event: FifaEvent): 'group' | 'knockout' {
  const name = event.name?.toLowerCase() ?? '';
  if (name.includes('matchday') || name.includes('round 1') || name.includes('round 2') || name.includes('round 3')) {
    return 'group';
  }
  return 'knockout';
}

export function formatEventLabel(event: FifaEvent): string {
  return event.name ?? `MD${event.id}`;
}
