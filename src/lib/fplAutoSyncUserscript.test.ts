import { describe, expect, it } from 'vitest';
import { buildFplAutoSyncUserscript } from './fplAutoSyncUserscript';

describe('FPL auto-sync userscript', () => {
  const script = buildFplAutoSyncUserscript('https://dashboard.example/', 'A'.repeat(43));

  it('is a syntactically valid userscript scoped to FPL', () => {
    expect(script).toContain('@match        https://fantasy.premierleague.com/*');
    expect(() => new Function(script.replace(/^\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/, ''))).not.toThrow();
  });

  it('reads authenticated FPL APIs and sends only the squad contract', () => {
    expect(script).toContain("fetch('/api/me/'");
    expect(script).toContain("fetch('/api/my-team/'");
    expect(script).toContain('https://dashboard.example/api/v1/planning/sync');
    expect(script).toContain("'Authorization': 'Bearer ' + token");
    expect(script).toContain("source: 'fpl-authenticated-my-team'");
  });

  it('never reads or copies browser credentials', () => {
    expect(script).not.toMatch(/document\.cookie|password|access_token|sessionStorage|localStorage/i);
  });

  it('automatically refreshes on load, focus, visibility, and a bounded timer', () => {
    expect(script).toContain('void sync()');
    expect(script).toContain("addEventListener('focus'");
    expect(script).toContain("addEventListener('visibilitychange'");
    expect(script).toContain('setInterval');
  });
});
