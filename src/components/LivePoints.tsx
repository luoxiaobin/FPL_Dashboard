'use client';

import { useEffect, useState } from 'react';
import styles from './LivePoints.module.css';

export default function LivePoints() {
  const [squad, setSquad] = useState<any>(null);

  useEffect(() => {
    fetch('/api/v1/squad/live')
      .then(res => res.json())
      .then(data => setSquad(data));
  }, []);

  if (!squad || squad.error || !squad.players) return <div style={{ textAlign: 'center', opacity: 0.5 }}>Loading...</div>;

  return (
    <div className={styles.container}>
      {squad.players.slice(0, 11).map((player: any) => (
        <div key={player.id} className={styles.playerRow}>
          <div className={styles.playerInfo}>
            <div className={styles.playerName}>
              {player.name}
              {player.is_captain && <span className={styles.captainTag}>C</span>}
            </div>
            <div className={styles.playerMeta}>
              {player.position} • {player.minutes} mins {player.bps > 0 && `• ${player.bps} bps`}
            </div>
          </div>
          <div className={`${styles.points} ${player.live_points >= 6 ? styles.high : player.live_points <= 2 ? styles.low : ''}`}>
            {player.bonus > 0 && <span style={{fontSize: '0.8rem', color: '#fbbf24', marginRight: '6px'}}>+{player.bonus}</span>}
            {player.live_points * (player.is_captain ? 2 : 1)}
          </div>
        </div>
      ))}
    </div>
  );
}
