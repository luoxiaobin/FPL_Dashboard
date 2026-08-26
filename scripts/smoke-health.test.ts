import { describe, expect, it, vi } from 'vitest';
// The production helper stays native ESM so the standalone Node smoke script has no build step.
import { requestHealthyResponse } from './smoke-health.mjs';

const jsonResponse = (status: number, body: unknown) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json' },
});

describe('requestHealthyResponse', () => {
  it('retries a transient 503 and returns the later healthy response', async () => {
    const request = vi.fn()
      .mockResolvedValueOnce(jsonResponse(503, { status: 'degraded', checks: { fpl: 'fail' } }))
      .mockResolvedValueOnce(jsonResponse(200, { status: 'ready', checks: { fpl: 'pass' } }));
    const wait = vi.fn().mockResolvedValue(undefined);
    const warn = vi.fn();

    const result = await requestHealthyResponse(request, { attempts: 3, backoffMs: 10, wait, warn });

    expect(result.attempt).toBe(2);
    expect(result.body.status).toBe('ready');
    expect(request).toHaveBeenCalledTimes(2);
    expect(wait).toHaveBeenCalledWith(10);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"fpl":"fail"'));
  });

  it('fails after bounded retries and includes the final health body', async () => {
    const request = vi.fn()
      .mockResolvedValueOnce(jsonResponse(503, { status: 'degraded', checks: { database: 'fail' } }))
      .mockResolvedValueOnce(jsonResponse(503, { status: 'degraded', checks: { fpl: 'fail' } }));

    await expect(requestHealthyResponse(request, {
      attempts: 2,
      backoffMs: 10,
      wait: vi.fn().mockResolvedValue(undefined),
      warn: vi.fn(),
    })).rejects.toThrow('"fpl":"fail"');

    expect(request).toHaveBeenCalledTimes(2);
  });

  it('retries a network error', async () => {
    const request = vi.fn()
      .mockRejectedValueOnce(new Error('socket reset'))
      .mockResolvedValueOnce(jsonResponse(200, { status: 'ready' }));

    const result = await requestHealthyResponse(request, {
      attempts: 2,
      backoffMs: 10,
      wait: vi.fn().mockResolvedValue(undefined),
      warn: vi.fn(),
    });

    expect(result.attempt).toBe(2);
  });
});
