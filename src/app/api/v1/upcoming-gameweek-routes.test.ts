import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { fplFetchMock } = vi.hoisted(() => ({
  fplFetchMock: vi.fn(),
}));

vi.mock('@/lib/session', () => ({
  getEntryIdFromSession: vi.fn().mockResolvedValue(3376378),
}));

vi.mock('@/lib/upstreamFetch', () => ({
  fplFetch: fplFetchMock,
  toSafeId: (value: string | number) => String(value),
}));

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {},
}));

import { GET as getFixtures } from './fixtures/route';
import { GET as getRankProjection } from './rank-projection/route';
import { POST as optimizeSquad } from './squad/optimize/route';
import { GET as getSuggestions } from './squad/suggestions/route';

const upcomingGameweek = {
  id: 1,
  is_current: false,
  is_next: true,
  finished: false,
  deadline_time: '2026-08-21T17:30:00Z',
};

const bootstrap = {
  events: [upcomingGameweek],
  teams: [],
  elements: [],
  element_types: [],
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function request(path: string, method = 'GET') {
  return new NextRequest(`http://localhost:3000${path}`, { method });
}

describe('upcoming gameweek route contracts', () => {
  beforeEach(() => {
    fplFetchMock.mockReset();
  });

  it('returns an intentional empty fixture state when public picks are unpublished', async () => {
    fplFetchMock
      .mockResolvedValueOnce(jsonResponse(bootstrap))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse({ detail: 'Not found.' }, 404));

    const response = await getFixtures(request('/api/v1/fixtures'));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      status: 'squad_unpublished',
      gameweek: 1,
      players: [],
      nextGWs: [1, 2, 3, 4, 5],
    });
  });

  it('returns no captaincy suggestions until public picks are published', async () => {
    fplFetchMock
      .mockResolvedValueOnce(jsonResponse(bootstrap))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse({ detail: 'Not found.' }, 404));

    const response = await getSuggestions(request('/api/v1/squad/suggestions'));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      status: 'squad_unpublished',
      targetGW: 1,
      suggestions: [],
      transferTarget: null,
    });
  });

  it('returns no transfer optimization until public picks are published', async () => {
    fplFetchMock
      .mockResolvedValueOnce(jsonResponse(bootstrap))
      .mockResolvedValueOnce(jsonResponse({ detail: 'Not found.' }, 404));

    const response = await optimizeSquad(request('/api/v1/squad/optimize', 'POST'));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      status: 'squad_unpublished',
      gameweek: 1,
      suggestions: [],
    });
  });

  it('describes the upcoming gameweek instead of claiming none exists', async () => {
    fplFetchMock.mockResolvedValueOnce(jsonResponse(bootstrap));

    const response = await getRankProjection(request('/api/v1/rank-projection'));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      status: 'squad_unpublished',
      gameweek: 1,
      deadline: '2026-08-21T17:30:00Z',
    });
  });
});
