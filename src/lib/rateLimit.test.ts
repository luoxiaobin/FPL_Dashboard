import { describe, expect, it, vi } from 'vitest';
import { createRateLimit } from './rateLimit';

describe('createRateLimit', () => {
  it('fails open when no shared provider is configured', async () => {
    await expect(createRateLimit(null)('203.0.113.1')).resolves.toBe(true);
  });

  it('allows a request accepted by the shared provider', async () => {
    const provider = { limit: vi.fn().mockResolvedValue({ success: true }) };

    await expect(createRateLimit(provider)('203.0.113.2')).resolves.toBe(true);
    expect(provider.limit).toHaveBeenCalledWith('203.0.113.2');
  });

  it('rejects a request denied by the shared provider', async () => {
    const provider = { limit: vi.fn().mockResolvedValue({ success: false }) };

    await expect(createRateLimit(provider)('203.0.113.3')).resolves.toBe(false);
  });

  it('fails open and reports a provider outage', async () => {
    const outage = new Error('provider unavailable');
    const provider = { limit: vi.fn().mockRejectedValue(outage) };
    const reportFailure = vi.fn();

    await expect(createRateLimit(provider, reportFailure)('203.0.113.4')).resolves.toBe(true);
    expect(reportFailure).toHaveBeenCalledWith(
      '[rateLimit] Upstash request failed, failing open:',
      outage,
    );
  });
});
