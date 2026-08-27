export interface PlanningGameweekEvent {
  id: number;
  is_current: boolean;
  is_next: boolean;
  is_previous?: boolean;
  finished: boolean;
  deadline_time: string;
}

export function selectPlanningGameweek(events: PlanningGameweekEvent[]): PlanningGameweekEvent {
  const event = events.find(candidate => candidate.is_next)
    ?? events.find(candidate => candidate.is_current && !candidate.finished)
    ?? events.find(candidate => candidate.is_current)
    ?? events.find(candidate => !candidate.finished)
    ?? events.at(-1);
  if (!event) throw new Error('FPL has no available Gameweek');
  return event;
}

export function selectPublishedSquadGameweek(
  events: PlanningGameweekEvent[],
  planningGameweek: PlanningGameweekEvent,
): PlanningGameweekEvent | null {
  const current = events.find(candidate => candidate.is_current && candidate.id <= planningGameweek.id);
  if (current) return current;

  return events
    .filter(candidate => candidate.id <= planningGameweek.id && (candidate.finished || candidate.is_previous))
    .sort((left, right) => right.id - left.id)[0] ?? null;
}
