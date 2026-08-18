// spec: docs/testing/fpl-test-strategy.md

import { expect, test } from '../../fixtures/playwright-test';
import { installDashboardFixture } from '../../fixtures/fpl-dashboard.fixture';

test('keeps the core dashboard readable and fixture ticker operable on mobile', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'Mobile-specific pilot check');

  await installDashboardFixture(page, { fixtureTicker: true });
  await page.goto('/');

  await expect(page.getByText('FPL Manager: Ada Manager')).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Pitch' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Substitutes' })).toBeVisible();

  const fixtureScroller = page.getByTestId('fixture-scroll-wrapper');
  await expect(fixtureScroller).toBeVisible();
  const scrollContainer = fixtureScroller.locator(':scope > div').first();
  const dimensions = await scrollContainer.evaluate(element => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeGreaterThan(dimensions.clientWidth);

  await scrollContainer.evaluate(element => element.scrollTo({ left: element.scrollWidth }));
  await expect.poll(() => scrollContainer.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
});
