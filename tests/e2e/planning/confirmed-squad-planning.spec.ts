import { expect, test } from '../../fixtures/playwright-test';

const scenario = (strategy: 'floor' | 'balanced' | 'upside', captainId: number) => ({
  strategy,
  label: strategy[0].toUpperCase() + strategy.slice(1),
  transfers: strategy === 'balanced' ? [{
    outPlayerId: 15,
    inPlayerId: 16,
    expectedGain: 5.5,
  }] : [],
  transferHit: 0,
  squad: Array.from({ length: 15 }, (_, index) => index + 1),
  startingEleven: Array.from({ length: 11 }, (_, index) => index + 1),
  bench: [12, 13, 14, 15],
  captainId,
  viceCaptainId: 2,
  chip: null,
  bankRemaining: 1.5,
  projectedGameweekPoints: 55 + captainId,
  projectedFiveGameweekPoints: 245 + captainId * 5,
  uncertainty: 0.12,
  tradeoff: `${strategy} planning tradeoff`,
  modelVersion: 'controlled-v1',
});

const planningPayload = {
  gameweek: 1,
  deadline: '2026-08-21T17:30:00Z',
  capturedAt: '2026-08-18T12:00:00Z',
  freshUntil: '2026-08-18T12:05:00Z',
  squadSource: 'authenticated-import',
  sourceCapturedAt: '2026-08-18T11:55:00Z',
  transferState: { freeTransfers: 0, unlimited: true },
  scenarios: [scenario('floor', 1), scenario('balanced', 2), scenario('upside', 3)],
  players: Object.fromEntries(Array.from({ length: 16 }, (_, index) => {
    const id = index + 1;
    return [String(id), {
      id,
      name: `Planning Player ${id}`,
      position: 3,
      teamId: id,
      price: 5,
      expectedTotal: 20 + id,
      floor: 14 + id,
      ceiling: 26 + id,
      uncertainty: 0.1,
    }];
  })),
};

test('uses a server-confirmed squad for complete constraint-aware planning', async ({ page }) => {
  const requests: Array<Record<string, unknown>> = [];
  await page.route('**/api/v1/planning/scenarios', async route => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(planningPayload),
    });
  });

  await page.goto('/planning');

  await expect(page.getByRole('heading', { name: 'Confirmed squad connected' })).toBeVisible();
  await expect(page.getByText(/Unlimited changes are modeled with no points hit/)).toBeVisible();
  await expect(page.getByRole('button', { name: /Floor/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Balanced/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Upside/i })).toBeVisible();

  await page.getByRole('button', { name: /Upside/i }).click();
  await expect(page.getByRole('heading', { name: 'Upside' })).toBeVisible();
  await expect(page.getByText('Planning Player 3').first()).toBeVisible();

  await page.getByLabel('Lock players').fill('3, 8');
  await page.getByLabel('Exclude targets').fill('16');
  await page.getByLabel('Maximum hit').selectOption('4');
  await page.getByLabel('Bank reserve').fill('1.5');
  const regeneratedRequest = page.waitForRequest(request =>
    new URL(request.url()).pathname === '/api/v1/planning/scenarios'
      && request.postDataJSON()?.constraints?.maxPointsHit === 4
  );
  await page.getByRole('button', { name: 'Regenerate plans' }).click();
  await regeneratedRequest;

  expect(requests.at(-1)).toEqual({
    constraints: {
      lockedPlayerIds: [3, 8],
      excludedPlayerIds: [16],
      maxPointsHit: 4,
      bankReserve: 1.5,
    },
  });
  expect(requests.every(request => !('importedSquad' in request))).toBe(true);
});
