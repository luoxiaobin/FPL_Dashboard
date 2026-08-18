import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '../../fixtures/playwright-test';

const AUTH_DIRECTORY = path.resolve('playwright/.auth');
const AUTH_STATE_PATH = path.join(AUTH_DIRECTORY, 'fpl.json');

test('@fpl-auth-setup saves a local authenticated FPL browser state', async ({ page, context }) => {
  const expectedEntryId = process.env.LIVE_FPL_ENTRY_ID;
  if (!expectedEntryId || !/^\d+$/.test(expectedEntryId)) {
    throw new Error('Set LIVE_FPL_ENTRY_ID to the numeric manager entry used for this local setup');
  }

  await page.goto('/');
  console.log('Sign in only in the opened FPL browser window. This test will detect the authenticated entry.');

  await expect.poll(async () => page.evaluate(async () => {
    const response = await fetch('/api/me/', { credentials: 'include' });
    if (!response.ok) return null;
    const body = await response.json();
    return body?.player?.entry ?? body?.entry ?? null;
  }), {
    message: `Waiting for authenticated FPL entry ${expectedEntryId}`,
    timeout: 5 * 60_000,
    intervals: [1_000, 2_000, 3_000],
  }).toBe(Number(expectedEntryId));

  await mkdir(AUTH_DIRECTORY, { recursive: true });
  await context.storageState({ path: AUTH_STATE_PATH });
  console.log(`FPL browser state saved locally to ${AUTH_STATE_PATH}`);
});
