'use client';

import { useEffect, useState } from 'react';
import styles from './GameweekHistory.module.css';

interface GWRow {
  event: number;
  points: number;
  total_points: number;
  rank: number;
  overall_rank: number;
  bank: number;
  event_transfers: number;
  event_transfers_cost: number;
  points_on_bench: number;
}

export default function GameweekHistory() {
  const [history, setHistory] = useState<GWRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch('/api/v1/user/history')
      .then(res => res.json())
      .then(data => {
        if (data?.current) {
          // Show most recent first
          setHistory([...data.current].reverse());
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className={styles.container}>
      <div className={styles.loadingText}>Loading History...</div>
    </div>
  );

  if (!history.length) return null;

  const displayRows = expanded ? history : history.slice(0, 5);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Gameweek History</h2>
        <button className={styles.toggleBtn} onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Show Less ▲' : `Show All ${history.length} GWs ▼`}
        </button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>GW</th>
              <th>Points</th>
              <th>GW Rank</th>
              <th>Overall Rank</th>
              <th>Transfers</th>
              <th>Hit</th>
              <th>Bench Pts</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((gw) => (
              <tr key={gw.event} className={styles.row}>
                <td className={styles.gwLabel}>GW {gw.event}</td>
                <td className={styles.points}>{gw.points}</td>
                <td className={styles.rank}>{gw.rank?.toLocaleString() ?? '-'}</td>
                <td className={styles.rank}>{gw.overall_rank?.toLocaleString() ?? '-'}</td>
                <td>{gw.event_transfers}</td>
                <td className={gw.event_transfers_cost > 0 ? styles.hit : ''}>
                  {gw.event_transfers_cost > 0 ? `-${gw.event_transfers_cost}` : '—'}
                </td>
                <td className={styles.bench}>{gw.points_on_bench}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
