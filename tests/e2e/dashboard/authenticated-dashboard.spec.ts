// spec: docs/testing/fpl-test-strategy.md

import { expect, test } from '../../fixtures/playwright-test';
import { controlledSquad, installDashboardFixture } from '../../fixtures/fpl-dashboard.fixture';

test.describe('Controlled authenticated dashboard', () => {
  test('renders the manager summary and complete 15-player squad', async ({ page }) => {
    await installDashboardFixture(page);
    await page.goto('/');

    await expect(page.getByText('FPL Manager: Ada Manager')).toBeVisible();
    await expect(page.getByText('12,345')).toBeVisible();
    await expect(page.getByText('£1.7m')).toBeVisible();
    await expect(page.getByText('Team Value: £101.3m')).toBeVisible();
    await expect(page.getByTestId('player-points')).toHaveCount(15);
    await expect(page.getByRole('heading', { name: 'Substitutes' })).toBeVisible();
  });

  test('keeps player identity, position, captaincy, and bench association intact', async ({ page }) => {
    await installDashboardFixture(page);
    await page.goto('/');

    const captainCard = page.getByRole('img', { name: 'Player One' }).locator('../..');
    const viceCaptainCard = page.getByRole('img', { name: 'Player Six' }).locator('../..');
    const benchCard = page.getByRole('img', { name: 'Bench Defender' }).locator('../..');

    await expect(captainCard).toContainText('Player One');
    await expect(captainCard).toContainText('C');
    await expect(viceCaptainCard).toContainText('Player Six');
    await expect(viceCaptainCard).toContainText('VC');
    await expect(benchCard).toContainText('IN');

    await page.getByRole('tab', { name: 'List' }).click();
    await expect(page.getByText('Player Two').locator('..')).toContainText('DEF • 90 mins');
    await expect(page.getByText('Bench', { exact: true })).toBeVisible();
    await expect(page.getByText('Bench Forward')).toBeVisible();
  });

  test('derives the displayed projected total and lifecycle label from controlled squad data', async ({ page }) => {
    await installDashboardFixture(page, { status: 'provisional' });
    await page.goto('/');

    const expectedTotal = controlledSquad
      .filter(player => player.was_started && !(player.minutes === 0 && player.is_finished))
      .reduce((total, player) => total + player.live_points * (player.multiplier || 1), 0)
      + controlledSquad.find(player => player.name === 'Bench Defender')!.live_points;

    await expect(page.getByText('GW7 Provisional Score')).toBeVisible();
    await expect(page.getByText('PROVISIONAL SCORE', { exact: true })).toBeVisible();
    await expect(page.getByTestId('gw-projected-total')).toContainText(String(expectedTotal));
    expect(expectedTotal).toBe(55);
  });

  test('maps a player to the correct DGW, blank, opponents, venues, and difficulties', async ({ page }) => {
    await installDashboardFixture(page, { fixtureTicker: true });
    await page.goto('/');

    const playerRow = page.getByRole('row').filter({ hasText: 'Player Six' });
    await expect(playerRow).toContainText('AAA');
    await expect(playerRow).toContainText('BBB');
    await expect(playerRow).toContainText('x2');
    await expect(playerRow).toContainText('—');
    await expect(playerRow.getByTitle('GW7: AAA (H) - Difficulty 2')).toBeVisible();
    await expect(playerRow.getByTitle('GW7: BBB (A) - Difficulty 4')).toBeVisible();
  });

  test('shows a bounded failure state when the critical summary API is unavailable', async ({ page }) => {
    await installDashboardFixture(page, { summaryFailure: true });
    await page.goto('/');

    await expect(page.getByRole('status')).toHaveText('Unable to load the dashboard. Please refresh and try again.');
    await expect(page.getByText('Loading dashboard…')).toHaveCount(0);
  });
});
