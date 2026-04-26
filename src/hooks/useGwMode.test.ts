import { describe, it, expect } from 'vitest';
import { statusToMode } from './useGwMode';

describe('statusToMode', () => {
  it('maps "live" to "live"', () => {
    expect(statusToMode('live')).toBe('live');
  });

  it('maps "finished" to "planning"', () => {
    expect(statusToMode('finished')).toBe('planning');
  });

  it('maps undefined to "planning"', () => {
    expect(statusToMode(undefined)).toBe('planning');
  });

  it('maps any other string to "planning"', () => {
    expect(statusToMode('upcoming')).toBe('planning');
    expect(statusToMode('between-gws')).toBe('planning');
  });
});
