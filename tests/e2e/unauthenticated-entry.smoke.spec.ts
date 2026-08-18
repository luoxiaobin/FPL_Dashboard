// spec: specs/initial-smoke-plan.md
// seed: seed.spec.ts

import { expect, test } from '../fixtures/playwright-test';

test.describe('Unauthenticated entry', () => {
  test('Show the Team ID login form', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: 'FPL Public Dashboard' })).toBeVisible();
    await expect(page.getByLabel('FPL Numeric Team ID')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Load Dashboard' })).toBeDisabled();
  });

  test('Reject a non-numeric Team ID locally', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('FPL Numeric Team ID').pressSequentially('not-a-team-id');
    await expect(page.getByRole('button', { name: 'Load Dashboard' })).toBeEnabled();
    await page.getByRole('button', { name: 'Load Dashboard' }).click();

    await expect(page.getByText('Team ID must be a numeric integer value (e.g. 123456).')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe('Public health contract', () => {
  test('Return a structured readiness response', async ({ request }) => {
    const response = await request.get('/api/v1/health');

    expect([200, 503]).toContain(response.status());
    const body = await response.json();
    expect(body.status).toMatch(/^(ready|degraded)$/);
    expect(body.checks).toEqual({
      configuration: expect.stringMatching(/^(pass|fail)$/),
      database: expect.stringMatching(/^(pass|fail)$/),
      fpl: expect.stringMatching(/^(pass|fail)$/),
    });
    expect(body.release).toEqual(expect.any(Object));
    expect(body.timestamp).toEqual(expect.any(String));
  });
});
