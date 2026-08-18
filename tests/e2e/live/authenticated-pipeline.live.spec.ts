// spec: docs/testing/live-integration-pilot.md

import { expect, test } from '../../fixtures/playwright-test';

test('@live authenticates a designated public entry and renders a coherent live squad', async ({ page }) => {
  const entryId = process.env.LIVE_FPL_ENTRY_ID;
  if (!entryId) throw new Error('LIVE_FPL_ENTRY_ID is required for the live integration pilot');

  let authenticated = false;
  try {
    await page.goto('/login');
    await page.getByLabel('FPL Numeric Team ID').fill(entryId);
    const squadResponsePromise = page.waitForResponse(response =>
      new URL(response.url()).pathname === '/api/v1/squad/live'
    );
    await page.getByRole('button', { name: 'Load Dashboard' }).click();

    await expect(page).toHaveURL(/\/$/, { timeout: 20_000 });
    authenticated = true;
    await expect(page.getByText(/^FPL Manager: /)).toBeVisible();
    const squadResponse = await squadResponsePromise;

    if (squadResponse.ok()) {
      await expect(page.getByTestId('player-points')).toHaveCount(15, { timeout: 20_000 });
      await expect(page.getByText(/^GW\d+ (Live|Provisional|Official) Score$/)).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Substitutes' })).toBeVisible();
    } else {
      expect(squadResponse.status()).toBe(404);
      await expect(page.getByText(/(?:No active gameweek right now\.|GW\d+ is upcoming\.)/)).toBeVisible();
      await expect(page.getByText('Score', { exact: true })).toBeVisible();
    }
  } finally {
    if (authenticated) {
      await page.request.post('/api/v1/auth/logout').catch(() => null);
    }
  }
});
