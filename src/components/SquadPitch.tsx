'use client';

import { useEffect, useState } from 'react';
import styles from './SquadPitch.module.css';

export default function SquadPitch() {
  const [squad, setSquad] = useState<any>(null);

  useEffect(() => {
    fetch('/api/v1/squad/live')
      .then(res => res.json())
      .then(data => setSquad(data));
  }, []);

  if (!squad || squad.error || !squad.players) return <div style={{ textAlign: 'center', opacity: 0.5 }}>Loading Pitch...</div>;

  const startingXI = squad.players.slice(0, 11);
  const bench = squad.players.slice(11);

  const getPlayersByPos = (players: any[], pos: string) => players.filter(p => p.position === pos);

  const renderPlayer = (p: any) => (
    <div key={p.id} className={styles.playerCard}>
      <div className={styles.playerName}>
        {p.name}
        {p.is_captain && <span className={styles.captainTag}>C</span>}
      </div>
      <div className={styles.playerPoints} style={{ color: p.live_points >= 6 ? '#22c55e' : p.live_points <= 2 ? '#ef4444' : '#38bdf8' }}>
        {p.live_points * (p.is_captain ? 2 : 1)}
      </div>
      <div className={styles.playerPrice}>
        £{p.price}m {(p.bonus > 0 || p.bps > 15) && <span style={{color: '#fbbf24', marginLeft: '4px'}}>{p.bonus > 0 ? `+${p.bonus}B` : `${p.bps}bps`}</span>}
      </div>
    </div>
  );

  return (
    <div>
      <div className={styles.pitch}>
        <div className={styles.row}>
          {getPlayersByPos(startingXI, 'FWD').map(renderPlayer)}
        </div>
        <div className={styles.row}>
          {getPlayersByPos(startingXI, 'MID').map(renderPlayer)}
        </div>
        <div className={styles.row}>
          {getPlayersByPos(startingXI, 'DEF').map(renderPlayer)}
        </div>
        <div className={styles.row}>
          {getPlayersByPos(startingXI, 'GKP').map(renderPlayer)}
        </div>
      </div>
      
      <div className={styles.bench}>
        <h3 style={{ color: '#94a3b8', marginBottom: '12px', fontSize: '0.9rem', textTransform: 'uppercase' }}>Substitutes</h3>
        <div className={styles.row} style={{ justifyContent: 'flex-start', flexWrap: 'wrap' }}>
          {bench.map(renderPlayer)}
        </div>
      </div>
    </div>
  );
}
