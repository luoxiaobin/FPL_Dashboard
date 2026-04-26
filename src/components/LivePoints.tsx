'use client';

import { useEffect, useState } from 'react';
import styles from './LivePoints.module.css';
import { getPlayerPhotoUrl, TRANSPARENT_IMAGE_DATA_URI } from '../lib/playerImage';

interface LivePlayer {
  id: number;
  name: string;
  position: string;
  live_points: number;
  is_captain: boolean;
  minutes: number;
  bps: number;
  bonus: number;
  photo: string;
  teamCode: number;
}

interface SquadData {
  status: 'live' | 'provisional' | 'official';
  players: LivePlayer[];
}

export default function LivePoints() {
  const [squad, setSquad] = useState<SquadData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/v1/squad/live')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) setSquad(data);
        else setError(true);
      })
      .catch(() => setError(true));
  }, []);

  if (error) return null;
  if (!squad || !squad.players) return <div style={{ textAlign: 'center', opacity: 0.5 }}>Loading...</div>;

  return (
    <div className={styles.container}>
      <div className={`${styles.statusBanner} ${styles[squad.status]}`}>
        {squad.status === 'official' ? 'OFFICIAL GW STATUS' : squad.status === 'provisional' ? 'PROVISIONAL (MATCHES DONE)' : 'LIVE GW DATA'}
      </div>
      {squad.players.slice(0, 11).sort((a, b) => b.live_points - a.live_points).map((player) => (
        <div key={player.id} className={styles.playerRow}>
          <div className={styles.playerImageMini}>
            <img 
              src={getPlayerPhotoUrl(player.photo, '40x40', player.id, player.teamCode)}
              alt={player.name}
              className={styles.pImg}
              onError={(e) => {
                (e.target as HTMLImageElement).src = TRANSPARENT_IMAGE_DATA_URI;
              }}
            />
          </div>
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
