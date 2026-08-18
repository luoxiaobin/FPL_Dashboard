import { describe, expect, it } from 'vitest';
import { resolveRelevantGameweek, squadUnpublishedPayload } from './fplAvailability';

describe('FPL gameweek availability', () => {
  it('prefers the current gameweek', () => {
    expect(resolveRelevantGameweek([
      { id: 1, is_current: true },
      { id: 2, is_next: true },
    ])?.id).toBe(1);
  });

  it('uses the upcoming gameweek before the season starts', () => {
    expect(resolveRelevantGameweek([
      { id: 1, is_next: true, deadline_time: '2026-08-21T17:30:00Z' },
    ])?.id).toBe(1);
  });

  it('describes unpublished squads as an expected bounded state', () => {
    expect(squadUnpublishedPayload({
      id: 1,
      is_next: true,
      deadline_time: '2026-08-21T17:30:00Z',
    })).toEqual({
      status: 'squad_unpublished',
      gameweek: 1,
      deadline: '2026-08-21T17:30:00Z',
      message: 'GW1 is upcoming. FPL keeps your current squad private until the deadline; import your confirmed squad in Planning to prepare.',
    });
  });
});
