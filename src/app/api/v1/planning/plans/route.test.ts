import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { getEntryIdFromSessionMock, loadLatestMyPlanMock, saveMyPlanMock } = vi.hoisted(() => ({
  getEntryIdFromSessionMock: vi.fn(),
  loadLatestMyPlanMock: vi.fn(),
  saveMyPlanMock: vi.fn(),
}));

vi.mock('@/lib/session', () => ({ getEntryIdFromSession: getEntryIdFromSessionMock }));
vi.mock('@/server/planning/reproducibilityStore', () => ({
  loadLatestMyPlan: loadLatestMyPlanMock,
  saveMyPlan: saveMyPlanMock,
}));

import { GET, POST } from './route';

describe('My Plan route', () => {
  beforeEach(() => {
    getEntryIdFromSessionMock.mockReset().mockResolvedValue('3376378');
    loadLatestMyPlanMock.mockReset();
    saveMyPlanMock.mockReset();
  });

  it('loads the latest plan for a requested Gameweek', async () => {
    loadLatestMyPlanMock.mockResolvedValue({ id: 'plan-1', gameweek: 2, strategy: 'balanced' });
    const response = await GET(new NextRequest('http://localhost/api/v1/planning/plans?gameweek=2'));
    expect(response.status).toBe(200);
    expect(loadLatestMyPlanMock).toHaveBeenCalledWith(3376378, 2);
    expect(await response.json()).toMatchObject({ plan: { strategy: 'balanced' } });
  });

  it('saves a persisted scenario as My Plan', async () => {
    const scenarioId = '22222222-2222-4222-8222-222222222222';
    saveMyPlanMock.mockResolvedValue({ id: 'plan-1', scenarioId, gameweek: 2, strategy: 'balanced' });
    const response = await POST(new NextRequest('http://localhost/api/v1/planning/plans', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ scenarioId }),
    }));
    expect(response.status).toBe(200);
    expect(saveMyPlanMock).toHaveBeenCalledWith(3376378, scenarioId);
  });

  it('rejects malformed scenario IDs', async () => {
    const response = await POST(new NextRequest('http://localhost/api/v1/planning/plans', {
      method: 'POST',
      body: JSON.stringify({ scenarioId: 'not-an-id' }),
    }));
    expect(response.status).toBe(400);
    expect(saveMyPlanMock).not.toHaveBeenCalled();
  });
});
