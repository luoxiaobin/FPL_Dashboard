'use client';

import { useEffect, useState } from 'react';
import styles from './TransferOptimizer.module.css';

interface Suggestion {
  out_id: number;
  in_id: number;
  expected_gain: number;
  out_name: string;
  in_name: string;
  rationale: string;
  out_team_code?: number | null;
  in_team_code?: number | null;
  out_club?: string | null;
  in_club?: string | null;
}

export default function TransferOptimizer() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/squad/optimize', { method: 'POST' })
      .then(res => {
        if (!res.ok) throw new Error('Optimizer route returned an error');
        return res.json();
      })
      .then(data => {
        if (data.suggestions) {
          setSuggestions(data.suggestions);
        } else if (data.error) {
          setError(data.error);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load transfer optimizations.');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className={styles.loading}>Running transfer simulations...</div>;
  if (error) return null; // Silently fail or handle gracefully if preferred, but usually we just don't show the widget on dashboard if unauthorized/err

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Transfer Optimizer</h2>
        <p className={styles.subtitle}>AI-driven recommendations based on expected points and fixtures</p>
      </div>

      {suggestions.length === 0 ? (
        <div className={styles.emptyState}>No recommended transfers found. Your squad is looking optimal!</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Recommend Out</th>
                <th>Recommend In</th>
                <th>Expected Advantage</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.map((s, idx) => (
                <tr key={idx} className={styles.row}>
                  <td>
                    <div className={styles.playerBlock}>
                      {s.out_team_code && (
                        <img
                          data-badge
                          src={`https://resources.premierleague.com/premierleague/badges/50/t${s.out_team_code}.png`}
                          alt={s.out_club ?? ''}
                          className={styles.clubBadge}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      )}
                      <div className={styles.playerText}>
                        <span className={styles.playerName}>
                          <span className={styles.arrowOut}>↑</span> {s.out_name}
                        </span>
                        {s.out_club && <span className={styles.clubName}>{s.out_club}</span>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.playerBlock}>
                      {s.in_team_code && (
                        <img
                          data-badge
                          src={`https://resources.premierleague.com/premierleague/badges/50/t${s.in_team_code}.png`}
                          alt={s.in_club ?? ''}
                          className={styles.clubBadge}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      )}
                      <div className={styles.playerText}>
                        <span className={styles.playerName}>
                          <span className={styles.arrowIn}>↓</span> {s.in_name}
                        </span>
                        {s.in_club && <span className={styles.clubName}>{s.in_club}</span>}
                        <div className={styles.rationale}>{s.rationale}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.gainBlock}>
                      <span className={styles.gainIcon}>⚡</span> +{s.expected_gain} pts
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
