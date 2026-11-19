import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { session, loadPlan, explain } = vi.hoisted(() => ({
  session: vi.fn(),
  loadPlan: vi.fn(),
  explain: vi.fn(),
}));

vi.mock('@/lib/session', () => ({ getEntryIdFromSession: session }));
vi.mock('@/server/planning/reproducibilityStore', () => ({ loadLatestMyPlan: loadPlan }));
vi.mock('@/server/planning/explanation', () => ({ explainSavedPlan: explain }));

import { POST } from './route';

function request(scenarioId = 'saved-scenario') {
  return new NextRequest('http://localhost/api/v1/planning/explanation', {
    method: 'POST',
    body: JSON.stringify({ scenarioId }),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');
});

afterEach(() => vi.unstubAllEnvs());

describe('saved-plan explanation', () => {
  it('requires a session', async () => {
    session.mockResolvedValue(null);
    expect((await POST(request())).status).toBe(401);
    expect(explain).not.toHaveBeenCalled();
  });

  it('rejects a scenario outside the manager’s latest saved plan', async () => {
    session.mockResolvedValue('42');
    loadPlan.mockResolvedValue({ scenarioId: 'different-scenario' });
    expect((await POST(request())).status).toBe(404);
    expect(loadPlan).toHaveBeenCalledWith(42);
    expect(explain).not.toHaveBeenCalled();
  });

  it('returns the explanation for the saved scenario', async () => {
    const plan = { scenarioId: 'saved-scenario' };
    session.mockResolvedValue('42');
    loadPlan.mockResolvedValue(plan);
    explain.mockResolvedValue('Cherki has the higher projection this Gameweek.');
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ explanation: 'Cherki has the higher projection this Gameweek.' });
    expect(explain).toHaveBeenCalledWith(plan, 'test-key');
  });

  it('returns a configuration message without a key', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    session.mockResolvedValue('42');
    expect((await POST(request())).status).toBe(503);
    expect(explain).not.toHaveBeenCalled();
  });
});
