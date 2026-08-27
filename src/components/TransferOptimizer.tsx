'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { PlanningScenario } from '@/server/planning/types';
import styles from './TransferOptimizer.module.css';

interface PlayerSummary {
  id: number;
  name: string;
}

interface PlanningRecommendation {
  gameweek: number;
  capturedAt: string;
  squadSource: 'authenticated-import' | 'public-gameweek';
  squadGameweek: number | null;
  scenarios: PlanningScenario[];
  players: Record<string, PlayerSummary>;
}

const formatNumber = (value: unknown, digits = 1) => Number.isFinite(Number(value))
  ? Number(value).toFixed(digits)
  : '—';

export default function TransferOptimizer() {
  const [data, setData] = useState<PlanningRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/planning/scenarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ constraints: {
        lockedPlayerIds: [],
        excludedPlayerIds: [],
        maxPointsHit: 0,
        bankReserve: 0,
      } }),
    })
      .then(async response => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Recommendation unavailable');
        setData(payload);
      })
      .catch(cause => setError(cause instanceof Error ? cause.message : 'Recommendation unavailable'))
      .finally(() => setLoading(false));
  }, []);

  const scenario = useMemo(() => data?.scenarios.find(item => item.strategy === 'balanced')
    ?? data?.scenarios[0], [data]);
  const playerName = (id: number) => data?.players[String(id)]?.name ?? `Player #${id}`;

  return (
    <section className={styles.container} aria-labelledby="transfer-recommendation-title">
      <div className={styles.header}>
        <div>
          <h2 id="transfer-recommendation-title" className={styles.title}>This Week&apos;s Move</h2>
          <p className={styles.subtitle}>Five-Gameweek decision support from the same model used in Planning</p>
        </div>
        <Link className={styles.planningLink} href="/planning">Compare scenarios</Link>
      </div>

      {loading && <div className={styles.loading}>Building your transfer recommendation…</div>}

      {!loading && error && (
        <div className={styles.status} role="alert">
          <strong>Recommendation unavailable</strong>
          <span>{error}</span>
          <Link href="/planning">Open Planning to retry</Link>
        </div>
      )}

      {!loading && !error && data && scenario && (
        <>
          <div className={styles.summary}>
            <div>
              <span className={styles.kicker}>GW{data.gameweek} balanced recommendation</span>
              <strong className={styles.decision}>{scenario.transfers.length > 0 ? 'Make the move' : 'Roll the transfer'}</strong>
              <p className={styles.tradeoff}>{scenario.tradeoff}</p>
            </div>
            <div className={styles.metrics}>
              <div><span>Five-GW expected</span><strong>{formatNumber(scenario.projectedFiveGameweekPoints)} pts</strong></div>
              <div><span>GW{data.gameweek} expected</span><strong>{formatNumber(scenario.projectedGameweekPoints)} pts</strong></div>
              <div><span>Bank after move</span><strong>£{formatNumber(scenario.bankRemaining)}m</strong></div>
              <div><span>Points hit</span><strong>{scenario.transferHit === 0 ? 'None' : `-${scenario.transferHit}`}</strong></div>
            </div>
          </div>

          {scenario.transfers.length > 0 ? (
            <div className={styles.moves}>
              {scenario.transfers.map(transfer => (
                <article className={styles.move} key={`${transfer.outPlayerId}-${transfer.inPlayerId}`}>
                  <div><span className={styles.label}>Sell</span><strong>{playerName(transfer.outPlayerId)}</strong></div>
                  <span className={styles.arrow} aria-hidden="true">→</span>
                  <div><span className={styles.label}>Buy</span><strong>{playerName(transfer.inPlayerId)}</strong></div>
                  <div className={styles.gain}><span>Five-GW gain</span><strong>+{formatNumber(transfer.expectedGain)} pts</strong></div>
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.status}>
              <strong>Hold is the recommendation—not an empty result</strong>
              <span>The model found no legal no-hit transfer that improves this five-Gameweek plan under the current projections and budget.</span>
            </div>
          )}

          <p className={styles.freshness}>
            {data.squadSource === 'authenticated-import'
              ? 'Using your confirmed pre-deadline squad'
              : `Using your published GW${data.squadGameweek ?? data.gameweek} squad`}
            {' · '}Updated {new Date(data.capturedAt).toLocaleString()}{' · '}Model {scenario.modelVersion}
          </p>
        </>
      )}
    </section>
  );
}
