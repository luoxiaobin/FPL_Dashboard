import { describe, it, expect, beforeEach } from 'vitest';
import { statusToMode, getStoredModeOverride, setStoredModeOverride } from './useGwMode';

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

describe('sessionStorage mode override', () => {
  beforeEach(() => sessionStorage.clear());

  it('getStoredModeOverride returns null when nothing stored', () => {
    expect(getStoredModeOverride()).toBeNull();
  });

  it('setStoredModeOverride("live") makes getStoredModeOverride return "live"', () => {
    setStoredModeOverride('live');
    expect(getStoredModeOverride()).toBe('live');
  });

  it('setStoredModeOverride("planning") makes getStoredModeOverride return "planning"', () => {
    setStoredModeOverride('planning');
    expect(getStoredModeOverride()).toBe('planning');
  });

  it('setStoredModeOverride(null) clears the stored value', () => {
    setStoredModeOverride('live');
    setStoredModeOverride(null);
    expect(getStoredModeOverride()).toBeNull();
  });
});
