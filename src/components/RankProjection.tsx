'use client';

import { useEffect, useState } from 'react';
import styles from './RankProjection.module.css';

interface RankData {
  status: 'live' | 'no_active_gw';
  gameweek?: number;
  liveScore?: number;
  gwAverage?: number;
  scoreDelta?: number;
  currentRank?: number;
  projectedRank?: number;
  rankDelta?: number;
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

  if (!data || data.status === 'no_active_gw') return (
    <div className={styles.card}>
      <div className={styles.label}>Live Rank Projection</div>
      <div className={styles.noGW}>⏸ No active gameweek right now</div>
    </div>
  );

  const isUp = (data.rankDelta ?? 0) < 0;
  const isDown = (data.rankDelta ?? 0) > 0;
  const arrow = isUp ? '▲' : isDown ? '▼' : '—';
  const deltaAbs = Math.abs(data.rankDelta ?? 0).toLocaleString();

  return (
    <div className={`${styles.card} ${isUp ? styles.up : isDown ? styles.down : styles.neutral}`}>
      <div className={styles.label}>GW{data.gameweek} Live Rank Projection</div>

      <div className={styles.mainRow}>
        <div className={styles.rankBlock}>
          <div className={styles.rankValue}>{data.projectedRank?.toLocaleString()}</div>
          <div className={styles.rankSub}>Projected Rank</div>
        </div>

        <div className={`${styles.deltaBlock} ${isUp ? styles.deltaUp : isDown ? styles.deltaDown : ''}`}>
          <span className={styles.arrow}>{arrow}</span>
          <span className={styles.deltaValue}>{deltaAbs}</span>
        </div>

        <div className={styles.rankBlock}>
          <div className={styles.rankValue}>{data.currentRank?.toLocaleString()}</div>
          <div className={styles.rankSub}>Current Rank</div>
        </div>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Your Score</span>
          <span className={styles.statValue}>{data.liveScore} pts</span>
        </div>
        <div className={styles.divider}>·</div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>GW Avg</span>
          <span className={styles.statValue}>{data.gwAverage} pts</span>
        </div>
        <div className={styles.divider}>·</div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>vs Average</span>
          <span className={`${styles.statValue} ${(data.scoreDelta ?? 0) >= 0 ? styles.positive : styles.negative}`}>
            {(data.scoreDelta ?? 0) >= 0 ? '+' : ''}{data.scoreDelta}
          </span>
        </div>
      </div>
    </div>
  );
}
