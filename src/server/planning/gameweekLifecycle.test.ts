import { describe, expect, it } from 'vitest';
import { selectPlanningGameweek, selectPublishedSquadGameweek } from './gameweekLifecycle';

const event = (id: number, values: Partial<{
  is_current: boolean;
  is_next: boolean;
  is_previous: boolean;
  finished: boolean;
}> = {}) => ({
  id,
  is_current: false,
  is_next: false,
  is_previous: false,
  finished: false,
  deadline_time: `2026-08-${20 + id}T17:30:00Z`,
  ...values,
});

describe('planning Gameweek lifecycle', () => {
  it('targets GW1 before the season when there is no current Gameweek', () => {
    const events = [event(1, { is_next: true })];
    expect(selectPlanningGameweek(events).id).toBe(1);
    expect(selectPublishedSquadGameweek(events, events[0])).toBeNull();
  });

  it('targets GW2 while published GW1 remains current', () => {
    const events = [
      event(1, { is_current: true, finished: true }),
      event(2, { is_next: true }),
    ];
    const planning = selectPlanningGameweek(events);
    expect(planning.id).toBe(2);
    expect(selectPublishedSquadGameweek(events, planning)?.id).toBe(1);
  });

  it('uses the final current Gameweek when no next Gameweek exists', () => {
    const events = [event(38, { is_current: true, finished: true })];
    const planning = selectPlanningGameweek(events);
    expect(planning.id).toBe(38);
    expect(selectPublishedSquadGameweek(events, planning)?.id).toBe(38);
  });
});
