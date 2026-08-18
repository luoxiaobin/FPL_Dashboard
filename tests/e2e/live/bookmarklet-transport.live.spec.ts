import { buildFplSquadBookmarklet } from '../../../src/lib/fplSquadBookmarklet';
import { expect, test } from '../../fixtures/playwright-test';

test('@fpl-bookmarklet transports the authenticated current squad for local review', async ({ page, context, baseURL }) => {
  const entryId = process.env.LIVE_FPL_ENTRY_ID;
  if (!entryId || !baseURL) throw new Error('Bookmarklet test requires LIVE_FPL_ENTRY_ID and PLAYWRIGHT_LIVE_BASE_URL');

  let dashboardAuthenticated = false;
  try {
    await page.goto(`${baseURL}/login`);
    await page.getByLabel('FPL Numeric Team ID').fill(entryId);
    await page.getByRole('button', { name: 'Load Dashboard' }).click();
    await expect(page).toHaveURL(`${baseURL}/`);
    dashboardAuthenticated = true;

    await page.goto('https://fantasy.premierleague.com/');
    const authenticatedEntry = await page.evaluate(async () => {
      const response = await fetch('/api/me/', { credentials: 'include' });
      if (!response.ok) return null;
      const body = await response.json();
      return body?.player?.entry ?? body?.entry ?? null;
    });
    expect(authenticatedEntry).toBe(Number(entryId));

    const bookmarklet = buildFplSquadBookmarklet(new URL(baseURL).origin);
    await page.evaluate(value => {
      const link = document.createElement('a');
      link.id = 'playwright-fpl-dashboard-bookmarklet';
      link.textContent = 'Send squad to FPL Dashboard';
      link.href = value;
      document.body.appendChild(link);
    }, bookmarklet);

    const popupPromise = context.waitForEvent('page');
    await page.locator('#playwright-fpl-dashboard-bookmarklet').click();
    const importPage = await popupPromise;
    await importPage.waitForURL(`${new URL(baseURL).origin}/planning/import`, { timeout: 20_000 });

    await expect(importPage.getByRole('heading', { name: 'Complete squad transport passed' })).toBeVisible();
    await expect(importPage.getByText(entryId, { exact: true })).toBeVisible();
    await expect(importPage.getByText('15', { exact: true })).toBeVisible();
    await expect(importPage.getByRole('heading', { name: 'Confirm this is your squad' })).toBeVisible();
    await expect(importPage.getByRole('button', { name: 'Confirm and save squad' })).toBeVisible();
  } finally {
    if (dashboardAuthenticated) {
      await page.request.post(`${baseURL}/api/v1/auth/logout`).catch(() => null);
    }
  }
});
