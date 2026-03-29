'use client';

import { useEffect, useState } from 'react';
import styles from './LeagueStandings.module.css';

export default function LeagueStandings({ onViewLive }: { onViewLive: (id: number) => void }) {
  const [leaguesData, setLeaguesData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/v1/leagues')
      .then(res => res.json())
      .then(data => setLeaguesData(data));
  }, []);

  if (!leaguesData || leaguesData.error || !leaguesData.leagues) return <div style={{ textAlign: 'center', opacity: 0.5 }}>Loading...</div>;

  return (
    <div className={styles.container}>
      {leaguesData.leagues.map((league: any) => (
        <div key={league.league_id} className={styles.leagueRow}>
          <div className={styles.rank}>#{league.rank}</div>
          <div className={styles.details}>
            <div className={styles.leagueName}>{league.name}</div>
            <div className={`${styles.movement} ${styles[league.movement]}`}>
              {league.movement === 'up' ? '▲ Up' : league.movement === 'down' ? '▼ Down' : '— No Change'}
            </div>
          </div>
          <button 
            className={styles.liveBtn}
            onClick={() => onViewLive(league.league_id)}
          >
            Live
          </button>
        </div>
      ))}
    </div>
  );
}
