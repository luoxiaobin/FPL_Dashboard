import { describe, expect, it } from 'vitest';
import { resolveGameweekContext, seasonCodeFromEvents } from './gameweekContext';
import type { FplEvent } from './types';

const event = (id: number, values: Partial<FplEvent> = {}): FplEvent => ({
  id,
  deadline_time: `2026-08-${String(20 + id).padStart(2, '0')}T17:30:00Z`,
  is_current: false,
  is_next: false,
  finished: false,
  ...values,
});

describe('resolveGameweekContext', () => {
  it('identifies the period before the first deadline', () => {
    expect(resolveGameweekContext([event(1, { is_next: true })])).toMatchObject({
      state: 'before_first_deadline', currentGW: null, nextGW: 1, picksGW: null, planningGW: 1,
    });
  });

  it('identifies a live gameweek', () => {
    expect(resolveGameweekContext([event(1, { is_current: true })])).toMatchObject({
      state: 'live', currentGW: 1, picksGW: 1, planningGW: 1,
    });
  });

  it('plans against the next event after a finished current event', () => {
    expect(resolveGameweekContext([
      event(1, { is_current: true, finished: true }),
      event(2, { is_next: true }),
    ])).toMatchObject({
      state: 'between_gameweeks', currentGW: 1, nextGW: 2, picksGW: 1, planningGW: 2,
    });
  });

  it('identifies postseason when every event is finished', () => {
    expect(resolveGameweekContext([event(37, { finished: true }), event(38, { is_current: true, finished: true })])).toMatchObject({
      state: 'postseason', currentGW: 38, planningGW: null,
    });
  });

  it('identifies an unflagged preseason payload', () => {
    expect(resolveGameweekContext([event(1)])).toMatchObject({ state: 'preseason', planningGW: 1 });
  });
});

describe('seasonCodeFromEvents', () => {
  it('derives the season from the first deadline', () => {
    expect(seasonCodeFromEvents([event(1)])).toBe('2026-27');
  });
});

