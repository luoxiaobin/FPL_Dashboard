export interface FplGameweek {
  id: number;
  is_current?: boolean;
  is_next?: boolean;
  finished?: boolean;
  deadline_time?: string;
}

export function resolveRelevantGameweek(events: FplGameweek[]): FplGameweek | undefined {
  return events.find((event) => event.is_current)
    ?? events.find((event) => event.is_next)
    ?? events[0];
}

export function squadUnpublishedPayload(gameweek: FplGameweek) {
  return {
    status: 'squad_unpublished' as const,
    gameweek: gameweek.id,
    deadline: gameweek.deadline_time ?? null,
    message: `GW${gameweek.id} is upcoming. FPL keeps your current squad private until the deadline; import your confirmed squad in Planning to prepare.`
  };
}
