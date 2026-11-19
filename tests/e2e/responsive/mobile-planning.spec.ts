// spec: docs/mobile-first-design.md

import { expect, test } from '../../fixtures/playwright-test';

const futureDeadline = new Date(Date.now() + 7 * 24 * 60 * 60_000).toISOString();
const capturedAt = new Date(Date.now() - 60_000).toISOString();
const selectedAt = new Date(Date.now() - 30_000).toISOString();

const playerIds = [...Array.from({ length: 14 }, (_, index) => index + 1), 16];
const startingEleven = Array.from({ length: 11 }, (_, index) => index + 1);
const bench = [12, 13, 14, 16];
const playerNames = Object.fromEntries(Array.from({ length: 16 }, (_, index) => [String(index + 1), `Planning Player ${index + 1}`]));

const scenario = (strategy: 'floor' | 'balanced' | 'upside', scenarioId: string) => ({
  scenarioId,
  strategy,
  label: strategy[0].toUpperCase() + strategy.slice(1),
  transfers: [{ outPlayerId: 15, inPlayerId: 16, expectedGain: 5.5, cost: 0.2 }],
  transferHit: 0,
  squad: playerIds,
  startingEleven,
  bench,
  captainId: 1,
  viceCaptainId: 2,
  chip: null,
  bankRemaining: 1.5,
  projectedGameweekPoints: strategy === 'floor' ? 61 : strategy === 'upside' ? 79 : 70,
  projectedFiveGameweekPoints: strategy === 'floor' ? 280 : strategy === 'upside' ? 390 : 335,
  versusHold: { gameweekPoints: 66, horizonPoints: 322, gameweekGain: 4, horizonGain: 13, horizonGameweeks: 5 },
  uncertainty: 0.12,
  tradeoff: `${strategy} planning tradeoff`,
  modelVersion: 'mobile-controlled-v1',
  ...(strategy === 'balanced' ? { chipAdvice: {
    expiresGameweek: 19,
    deadline: futureDeadline,
    activeChip: null,
    throughGameweek: 15,
    recommendation: 'bboost',
    options: [
      { chip: 'bboost', used: false, currentPoints: 13.2, best: { gameweek: 11, points: 13.2 }, later: { gameweek: 12, points: 8.1 } },
      { chip: '3xc', used: false, currentPoints: 7.4, best: { gameweek: 13, points: 9.2 }, later: { gameweek: 13, points: 9.2 } },
    ],
  } } : {}),
});

const scenarios = [
  scenario('floor', '00000000-0000-4000-8000-000000000001'),
  scenario('balanced', '00000000-0000-4000-8000-000000000002'),
  scenario('upside', '00000000-0000-4000-8000-000000000003'),
];

const players = Object.fromEntries(Array.from({ length: 16 }, (_, index) => {
  const id = index + 1;
  return [String(id), {
    id,
    name: playerNames[String(id)],
    position: id === 1 || id === 12 ? 1 : id < 7 ? 2 : id < 12 ? 3 : 4,
    teamId: id,
    price: 5,
    expectedTotal: 20 + id,
    expectedByGameweek: [3 + id / 10, 4, 4, 4, 4],
    floor: 14 + id,
    ceiling: 26 + id,
    uncertainty: 0.1,
  }];
}));

const savedPlan = {
  id: '00000000-0000-4000-8000-000000000010',
  scenarioId: scenarios[1].scenarioId,
  strategy: 'balanced',
  gameweek: 11,
  selectedAt,
  frozenAt: null,
  outcome: null,
  decisions: { ...scenarios[1], deadline: futureDeadline },
  playerNames,
};

test('keeps the complete Planning and My Plan workflow usable at mobile width', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'Mobile-specific Planning check');

  await page.route('**/api/v1/planning/**', async route => {
    const url = new URL(route.request().url());
    const method = route.request().method();
    let body: unknown = {};
    if (url.pathname === '/api/v1/planning/scenarios') body = {
      gameweek: 11,
      deadline: futureDeadline,
      capturedAt,
      freshUntil: futureDeadline,
      squadSource: 'authenticated-import',
      squadGameweek: null,
      sourceCapturedAt: capturedAt,
      transferState: { freeTransfers: 0, unlimited: false },
      scenarios,
      players,
      reproducibility: 'persisted',
    };
    if (url.pathname === '/api/v1/planning/plans') body = method === 'POST' ? { plan: savedPlan } : { plan: null };
    if (url.pathname === '/api/v1/planning/team-news') body = { batch: {
      processed_at: capturedAt,
      model_name: 'Claude Haiku 5.5',
      signals: [{ playerId: 1, signal: 'expected_start', evidence: [{
        url: 'https://club.example/news', publishedAt: capturedAt, quote: 'Planning Player 1 is expected to start.',
      }] }],
    } };
    if (url.pathname === '/api/v1/planning/import') body = {
      capturedAt: new Date(Date.now() - 10_000).toISOString(),
      picks: playerIds.map((elementId, index) => ({
        elementId,
        lineupPosition: index + 1,
        isCaptain: elementId === 1,
        isViceCaptain: elementId === 2,
      })),
    };
    if (url.pathname === '/api/v1/planning/explanation') body = { explanation: 'A concise controlled explanation for the mobile workflow.' };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });

  await page.goto('/planning');

  await expect(page.getByRole('heading', { name: 'Confirmed squad connected' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'GW11 Team News' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Chip opportunities' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Balanced/i })).toBeVisible();

  const noPageOverflow = async () => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
  await expect.poll(noPageOverflow).toBe(true);

  await page.getByRole('button', { name: /Balanced/i }).click();
  await expect(page.getByRole('heading', { name: 'Balanced' })).toBeVisible();
  await page.getByRole('button', { name: 'Mark as My Plan' }).click();
  await expect(page.getByRole('button', { name: 'Saved as My Plan' })).toBeVisible();

  await page.getByText('Review on FPL').click();
  await expect(page.getByRole('heading', { name: 'Check your FPL changes' })).toBeVisible();
  await expect(page.getByText('Bench order · Matches plan')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Explain this plan' })).toBeVisible();
  await expect.poll(noPageOverflow).toBe(true);

  const keyActions = page.getByRole('button', { name: /Check latest sync|Explain this plan|Saved as My Plan/ });
  for (let index = 0; index < await keyActions.count(); index += 1) {
    const box = await keyActions.nth(index).boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  }
});
