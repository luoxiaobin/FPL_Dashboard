import { describe, expect, it } from 'vitest';
import {
  buildFplProbeBookmarklet,
  decodeFplImportProbe,
  encodeFplImportProbe,
  type FplImportProbe,
} from './fplImportProbe';

const probe: FplImportProbe = {
  schemaVersion: 0,
  entryId: 123456,
  pickCount: 15,
  captainCount: 1,
  viceCaptainCount: 1,
  hasBank: true,
  capturedAt: '2026-08-18T12:00:00.000Z',
};

describe('FPL bookmarklet feasibility probe', () => {
  it('round-trips a minimal non-credential payload', () => {
    expect(decodeFplImportProbe(encodeFplImportProbe(probe))).toEqual(probe);
  });

  it('rejects malformed probe data', () => {
    const malformed = encodeFplImportProbe({ ...probe, pickCount: -1 });
    expect(() => decodeFplImportProbe(malformed)).toThrow('invalid');
  });

  it('uses authenticated FPL endpoints without reading browser secrets', () => {
    const bookmarklet = buildFplProbeBookmarklet('https://dashboard.example');
    expect(() => new Function(bookmarklet.slice('javascript:'.length))).not.toThrow();
    expect(bookmarklet).toContain("fetch('/api/me/'");
    expect(bookmarklet).toContain("fetch('/api/my-team/'");
    expect(bookmarklet).toContain('credentials');
    expect(bookmarklet).not.toMatch(/document\.cookie|localStorage|password|access_token/i);
    expect(bookmarklet).toContain('https://dashboard.example/planning/import/probe#data=');
  });
});
