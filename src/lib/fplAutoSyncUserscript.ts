const normalizeOrigin = (origin: string) => origin.replace(/\/$/, '');

export function buildFplAutoSyncUserscript(dashboardOrigin: string, token: string): string {
  const origin = normalizeOrigin(dashboardOrigin);
  const endpoint = `${origin}/api/v1/planning/sync`;
  return `// ==UserScript==
// @name         FPL Dashboard Auto-Sync
// @namespace    ${origin}
// @version      1.0.0
// @description  Securely sync the signed-in FPL Pick Team squad to FPL Dashboard.
// @match        https://fantasy.premierleague.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  'use strict';
  const dashboard = ${JSON.stringify(origin)};
  const endpoint = ${JSON.stringify(endpoint)};
  const token = ${JSON.stringify(token)};
  let lastContract = '';
  let syncing = false;

  const notify = (message, error = false) => {
    let node = document.getElementById('fpl-dashboard-auto-sync-status');
    if (!node) {
      node = document.createElement('div');
      node.id = 'fpl-dashboard-auto-sync-status';
      Object.assign(node.style, {
        position: 'fixed', right: '18px', bottom: '18px', zIndex: '2147483647',
        maxWidth: '340px', padding: '12px 16px', borderRadius: '10px',
        color: '#edf7f0', background: '#0c2115', border: '1px solid #2d6844',
        boxShadow: '0 8px 30px rgba(0,0,0,.35)', font: '600 14px system-ui'
      });
      document.body.appendChild(node);
    }
    node.style.borderColor = error ? '#ef4444' : '#2d6844';
    node.textContent = message;
    node.hidden = false;
    window.setTimeout(() => { node.hidden = true; }, error ? 12000 : 5000);
  };

  const currentSquad = async () => {
    const meResponse = await fetch('/api/me/', { credentials: 'include' });
    if (!meResponse.ok) throw new Error('Sign in to FPL to enable dashboard auto-sync');
    const me = await meResponse.json();
    const entryId = me?.player?.entry ?? me?.entry;
    if (!Number.isInteger(entryId) || entryId <= 0) throw new Error('No FPL entry was found');
    const teamResponse = await fetch('/api/my-team/' + entryId + '/', { credentials: 'include' });
    if (!teamResponse.ok) throw new Error('FPL did not return the current Pick Team squad');
    const team = await teamResponse.json();
    const activeChip = typeof team?.active_chip === 'string'
      ? team.active_chip
      : (Array.isArray(team?.chips) ? team.chips.find(chip => chip?.status === 'active')?.name ?? null : null);
    return {
      schemaVersion: 1,
      source: 'fpl-authenticated-my-team',
      entryId,
      capturedAt: new Date().toISOString(),
      activeChip,
      picks: (Array.isArray(team?.picks) ? team.picks : []).map(pick => ({
        elementId: pick?.element,
        lineupPosition: pick?.position,
        sellingPrice: pick?.selling_price,
        purchasePrice: pick?.purchase_price,
        multiplier: pick?.multiplier,
        isCaptain: pick?.is_captain === true,
        isViceCaptain: pick?.is_vice_captain === true,
      })),
      transfers: {
        bank: team?.transfers?.bank,
        squadValue: team?.transfers?.value,
        freeTransfers: team?.transfers?.limit ?? null,
        transfersMade: team?.transfers?.made,
        transferCost: team?.transfers?.cost,
        status: team?.transfers?.status,
      },
    };
  };

  const sync = async (manual = false) => {
    if (syncing || document.visibilityState !== 'visible') return;
    syncing = true;
    try {
      const squad = await currentSquad();
      const signature = JSON.stringify({ ...squad, capturedAt: null });
      if (!manual && signature === lastContract) return;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ importedSquad: squad }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || 'Dashboard rejected the squad');
      lastContract = signature;
      notify('FPL Dashboard synced ' + squad.picks.length + ' players for GW' + result.gameweek);
      window.dispatchEvent(new CustomEvent('fpl-dashboard-synced', { detail: result }));
    } catch (error) {
      notify('FPL Dashboard: ' + (error?.message || 'Auto-sync failed'), true);
    } finally {
      syncing = false;
    }
  };

  window.FPLDashboardSync = () => sync(true);
  void sync();
  window.addEventListener('focus', () => void sync());
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') void sync(); });
  window.setInterval(() => void sync(), 60000);
  console.info('FPL Dashboard auto-sync ready. Run FPLDashboardSync() for a manual refresh.', dashboard);
})();
`;
}
