import type { FplEvent } from './types';

export type SeasonState =
  | 'preseason'
  | 'before_first_deadline'
  | 'live'
  | 'between_gameweeks'
  | 'postseason';

export interface GameweekContext {
  state: SeasonState;
  seasonCode: string;
  currentGW: number | null;
  nextGW: number | null;
  picksGW: number | null;
  planningGW: number | null;
}

export function seasonCodeFromEvents(events: FplEvent[], now = new Date()): string {
  const firstDeadline = events
    .filter(event => event.deadline_time)
    .map(event => new Date(event.deadline_time))
    .find(date => !Number.isNaN(date.getTime()));
  const startYear = firstDeadline?.getUTCFullYear() ?? (now.getUTCMonth() >= 5 ? now.getUTCFullYear() : now.getUTCFullYear() - 1);
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;
}

export function resolveGameweekContext(events: FplEvent[], now = new Date()): GameweekContext {
  const ordered = [...events].sort((a, b) => a.id - b.id);
  const seasonCode = seasonCodeFromEvents(ordered, now);
  const current = ordered.find(event => event.is_current) ?? null;
  const next = ordered.find(event => event.is_next) ?? null;

  if (current) {
    const following = next ?? ordered.find(event => event.id > current.id && !event.finished) ?? null;
    if (current.finished && !following) {
      return { state: 'postseason', seasonCode, currentGW: current.id, nextGW: null, picksGW: current.id, planningGW: null };
    }
    if (current.finished && following) {
      return { state: 'between_gameweeks', seasonCode, currentGW: current.id, nextGW: following.id, picksGW: current.id, planningGW: following.id };
    }
    return { state: 'live', seasonCode, currentGW: current.id, nextGW: following?.id ?? null, picksGW: current.id, planningGW: current.id };
  }

  if (next?.id === 1) {
    return { state: 'before_first_deadline', seasonCode, currentGW: null, nextGW: 1, picksGW: null, planningGW: 1 };
  }

  if (next) {
    const previous = [...ordered].reverse().find(event => event.id < next.id && event.finished) ?? null;
    return { state: 'between_gameweeks', seasonCode, currentGW: previous?.id ?? null, nextGW: next.id, picksGW: previous?.id ?? null, planningGW: next.id };
  }

  if (ordered.length > 0 && ordered.every(event => event.finished)) {
    const last = ordered[ordered.length - 1];
    return { state: 'postseason', seasonCode, currentGW: last.id, nextGW: null, picksGW: last.id, planningGW: null };
  }

  return { state: 'preseason', seasonCode, currentGW: null, nextGW: null, picksGW: null, planningGW: ordered[0]?.id ?? null };
}

