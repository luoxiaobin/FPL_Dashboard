import { test, expect } from '@playwright/test';

test.describe('Unauthenticated entry', () => {
  test('seed login page', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: 'FPL Public Dashboard' })).toBeVisible();
    await expect(page.getByLabel('FPL Numeric Team ID')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Load Dashboard' })).toBeDisabled();
  });
});
