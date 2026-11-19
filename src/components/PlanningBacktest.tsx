import { useEffect, useState } from 'react';
import type { loadLatestBacktest } from '@/server/planning/backtest';
import styles from './TransferOptimizer.module.css';

type Backtest = Awaited<ReturnType<typeof loadLatestBacktest>>;
const signed = (value: number) => value > 0 ? `+${value}` : String(value);
const chipNames: Record<string, string> = { bboost: 'Bench Boost', '3xc': 'Triple Captain', freehit: 'Free Hit', wildcard: 'Wildcard' };

export default function PlanningBacktest() {
  const [data, setData] = useState<Backtest>();
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void fetch('/api/v1/planning/backtest', { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error('Backtest unavailable');
      const result = await response.json();
      if (!controller.signal.aborted) setData(result);
    }).catch(() => {
      if (!controller.signal.aborted) setError(true);
    });
    return () => controller.abort();
  }, []);

  return (
    <section className={styles.container} aria-labelledby="planning-backtest-title">
      <h2 id="planning-backtest-title" className={styles.title}>Planning backtest</h2>
      {error && <p role="status">The backtest is temporarily unavailable.</p>}
      {!data && !error && <p role="status">Checking the latest finalized Gameweek…</p>}
      {data?.status === 'no_finalized_gameweek' && <p>No Gameweeks have finalized yet.</p>}
      {data?.status === 'no_recommendation' && <p>No pre-deadline recommendation recorded for GW{data.gameweek}.</p>}
      {data?.status === 'incomplete_results' && <p>GW{data.gameweek} player results are incomplete for this recorded plan.</p>}
      {data?.status === 'ready' && <>
        <p className={styles.subtitle}>GW{data.gameweek} · Balanced recommendation recorded {new Date(data.recordedAt).toLocaleString()}</p>
        <div className={`${styles.metrics} ${styles.backtestMetrics}`}>
          <div><span>Your actual score</span><strong>{data.actual.net} pts</strong></div>
          <div><span>Recommended plan replay</span><strong>{data.planned.net} pts</strong></div>
          <div><span>Replay difference</span><strong>{signed(data.difference)} pts</strong></div>
        </div>
        {data.chipComparison && <p>
          Recorded {chipNames[data.chipComparison.chip]} advice · {data.chipComparison.withoutChip} pts without the chip,
          {' '}{data.chipComparison.withChip} pts with it ({signed(data.chipComparison.gain)} pts).
        </p>}
        <details>
          <summary className={styles.backtestDetails}>See the points breakdown</summary>
          <ul className={styles.backtestList}>
            <li>Points before transfer hits · {data.actual.gross} actual, {data.planned.gross} replay ({signed(data.grossDifference)})</li>
            <li>Transfer hits · {data.actual.transferHit} actual, {data.planned.transferHit} replay ({signed(data.transferHitDifference)} net impact)</li>
            <li>Replay captain bonus · {signed(data.planned.captainBonus)}{data.planned.captainScorer &&
              ` from ${data.planned.captainScorer}${data.planned.captainFallback ? ' (vice-captain fallback)' : ''}`}</li>
            <li>Replay {data.planned.chip === 'bboost' ? 'Bench Boost' : 'auto-sub'} points · {signed(data.planned.benchPoints)}
              {data.planned.substitutions.map(swap => <div key={swap.outgoing}>{swap.incoming} for {swap.outgoing} · {signed(swap.points)} pts</div>)}</li>
            <li>Chip · {chipNames[data.actual.chip ?? ''] ?? 'None'} actual, {chipNames[data.planned.chip ?? ''] ?? 'None'} in replay</li>
          </ul>
        </details>
      </>}
    </section>
  );
}
