import { describe, expect, it } from 'vitest';
import { evaluateHealthHistory } from './smoke-history.mjs';

const result = (status: 'healthy' | 'degraded' | 'outage') => ({ status });

describe('evaluateHealthHistory', () => {
  it('does not escalate one recovered check', () => {
    const evaluation = evaluateHealthHistory(
      [result('healthy'), result('healthy')],
      result('degraded'),
    );

    expect(evaluation.escalate).toBe(false);
    expect(evaluation.degradedCount).toBe(1);
  });

  it('escalates two recovered checks within the last three runs', () => {
    const evaluation = evaluateHealthHistory(
      [result('degraded'), result('healthy')],
      result('degraded'),
    );

    expect(evaluation.escalate).toBe(true);
    expect(evaluation.degradedCount).toBe(2);
  });

  it('does not count degraded checks outside the rolling window', () => {
    const evaluation = evaluateHealthHistory(
      [result('degraded'), result('healthy'), result('healthy')],
      result('healthy'),
    );

    expect(evaluation.escalate).toBe(false);
    expect(evaluation.degradedCount).toBe(0);
  });

  it('immediately escalates an outage', () => {
    const evaluation = evaluateHealthHistory([], { status: 'outage', error: 'HTTP 503' });

    expect(evaluation.escalate).toBe(true);
    expect(evaluation.reason).toContain('HTTP 503');
  });
});
