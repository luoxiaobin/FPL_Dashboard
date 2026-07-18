export interface FplEvent {
  id: number;
  name?: string;
  deadline_time: string;
  is_current: boolean;
  is_next: boolean;
  finished: boolean;
  data_checked?: boolean;
  average_entry_score?: number;
}

export interface FplBootstrap {
  events: FplEvent[];
  elements: Array<Record<string, unknown> & { id: number; element_type: number; team: number }>;
  element_types: Array<Record<string, unknown> & { id: number; singular_name_short: string }>;
  teams: Array<Record<string, unknown> & { id: number; code: number; name: string; short_name: string }>;
  total_players?: number;
}

export interface FplPick {
  element: number;
  position: number;
  multiplier: number;
  is_captain: boolean;
  is_vice_captain: boolean;
  selling_price?: number;
}

export interface FplPicksResponse {
  active_chip: string | null;
  picks: FplPick[];
  entry_history?: {
    bank?: number;
    event_transfers?: number;
    event_transfers_cost?: number;
    points?: number;
    total_points?: number;
  };
}

