'use client';

import { useEffect, useState } from 'react';
import styles from './RankProjection.module.css';

interface RankData {
  status: 'live' | 'final' | 'no_active_gw';
  gameweek?: number;
  liveScore?: number;
  gwAverage?: number;
  scoreDelta?: number;
  currentRank?: number;
  projectedRank?: number;
  rankDelta?: number;
  pointsToNextTier?: number;
  nextTier?: number;
  totalPlayers?: number;
  message?: string;
}

export default function RankProjection() {
  const [data, setData] = useState<RankData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/rank-projection')
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className={styles.card}>
      <div className={styles.loadingText}>Calculating rank projection...</div>
    </div>
  );

  if (!data || data.status === 'no_active_gw') {
    return (
      <div className={styles.container}>
        <div className={styles.message}>{data?.message || 'Loading projection...'}</div>
      </div>
    );
  }

  const isUp = (data.rankDelta ?? 0) < 0;
  const isDown = (data.rankDelta ?? 0) > 0;
  const deltaAbs = Math.abs(data.rankDelta ?? 0).toLocaleString();
  const arrow = isUp ? '▲' : isDown ? '▼' : '—';
  const isFinal = data.status === 'final';

  return (
    <div className={`${styles.container} ${isFinal ? styles.finalMode : ''}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          GW{data.gameweek} {isFinal ? 'OFFICIAL RANK' : 'RANK PROJECTION'}
        </h3>
        {!isFinal && <div className={styles.modelBadge}>CONSERVATIVE MODEL</div>}
        {isFinal && <div className={styles.finalBadge}>DATA CHECKED</div>}
      </div>

      <div className={styles.mainRow}>
        <div className={styles.rankBlock}>
          <div className={styles.rankValue}>{data.projectedRank?.toLocaleString()}</div>
          <div className={styles.rankSub}>{isFinal ? 'Official Rank' : 'Projected Rank'}</div>
          {data.projectedRank && data.totalPlayers && (
            <div className={styles.percentBadge}>
              Top {((data.projectedRank / data.totalPlayers) * 100).toFixed(2)}%
            </div>
          )}
        </div>

        <div className={`${styles.deltaBlock} ${isUp ? styles.deltaUp : isDown ? styles.deltaDown : ''}`}>
          <span className={styles.arrow}>{arrow}</span>
          <span className={styles.deltaValue}>{deltaAbs}</span>
        </div>

        <div className={styles.rankBlock}>
          <div className={styles.rankValue}>{data.currentRank?.toLocaleString()}</div>
          <div className={styles.rankSub}>{isFinal ? 'Previous Rank' : 'Current Rank'}</div>
          {data.currentRank && data.totalPlayers && (
            <div className={styles.percentBadge}>
              Top {((data.currentRank / data.totalPlayers) * 100).toFixed(2)}%
            </div>
          )}
        </div>
      </div>

      {!isFinal && data.pointsToNextTier && (
        <div className={styles.tierTracker}>
          <span className={styles.tierPts}>{data.pointsToNextTier} pts</span>
          <span className={styles.tierText}>to reach No. {data.nextTier?.toLocaleString()}</span>
        </div>
      )}

      <div className={styles.statsFooter}>
        <div className={styles.stat}>
          <div className={styles.statLabel}>LIVE SCORE</div>
          <div className={styles.statValue}>{data.liveScore} pts</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>GW AVG</div>
          <div className={styles.statValue}>{data.gwAverage} pts</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>VS AVERAGE</div>
          <div className={`${styles.statValue} ${(data.scoreDelta ?? 0) >= 0 ? styles.pos : styles.neg}`}>
            {(data.scoreDelta ?? 0) >= 0 ? '+' : ''}{data.scoreDelta}
          </div>
        </div>
      </div>
    </div>
  );
}
