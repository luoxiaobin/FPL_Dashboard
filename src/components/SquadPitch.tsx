'use client';

import { useEffect, useState } from 'react';
import styles from './SquadPitch.module.css';

export default function SquadPitch() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/v1/squad/live')
      .then(res => res.json())
      .then(d => setData(d));
  }, []);

  if (!data || data.error || !data.players) return <div style={{ textAlign: 'center', opacity: 0.5 }}>Loading Pitch...</div>;

  const players = [...data.players].sort((a, b) => a.official_pos - b.official_pos);
  const starters = players.filter(p => p.was_started);
  const bench = players.filter(p => !p.was_started);

  // Logic: Find starters with 0 mins whose games are finished
  const missingStarters = starters.filter(p => p.minutes === 0 && p.is_finished);
  
  // Logic: Track who is coming in from the bench
  const subsIn: any[] = [];
  const availableBench = [...bench];
  
  missingStarters.forEach(() => {
    // Take the first bench player who actually played or whose game hasn't finished yet
    const subIdx = availableBench.findIndex(p => p.minutes > 0 || !p.is_finished);
    if (subIdx !== -1) {
      subsIn.push(availableBench[subIdx].id);
      availableBench.splice(subIdx, 1);
    }
  });

  // Calculate Projected Total
  const activeTotal = starters.reduce((acc, p) => {
    const isMissing = missingStarters.find(m => m.id === p.id);
    if (isMissing) return acc; // They score 0
    return acc + (p.live_points * p.multiplier);
  }, 0);

  const subTotal = bench.filter(p => subsIn.includes(p.id)).reduce((acc, p) => {
    return acc + p.live_points;
  }, 0);

  const projectedTotal = activeTotal + subTotal;

  const status = data.status || 'live';

  const getStatusLabel = () => {
    switch (status) {
      case 'official': return 'OFFICIAL POINTS';
      case 'provisional': return 'PROVISIONAL SCORE';
      default: return 'LIVE PROJECTED POINTS';
    }
  };

  const getPlayersByPos = (playersList: any[], pos: string) => playersList.filter(p => p.position === pos);

  const renderPlayer = (p: any, type: 'pitch' | 'bench') => {
    const isMissing = missingStarters.find(m => m.id === p.id);
    const isIncoming = subsIn.includes(p.id);
    
    return (
      <div 
        key={p.id} 
        className={`${styles.playerCard} ${isMissing ? styles.dimmed : ''} ${isIncoming ? styles.highlight : ''}`}
        style={{ borderColor: p.team_code === 43 ? '#38bdf8' : p.team_code === 1 ? '#ef4444' : 'rgba(255, 255, 255, 0.1)' }}
      >
        <div className={styles.playerImageContainer}>
          <img 
            src={`https://resources.premierleague.com/premierleague/photos/players/110x140/p${p.photo?.replace('.jpg', '').replace('.png', '') || '250123'}.png`} 
            alt={p.name}
            className={styles.playerImage}
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              if (img.src.includes('data:image/')) return;
              img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            }}
          />
        </div>
        <div className={styles.playerName}>
          {p.name}
          {p.is_captain && <span className={styles.captainTag}>C</span>}
          {p.is_vice_captain && !starters.find(s => s.is_captain && s.minutes > 0) && <span className={styles.captainTag} style={{background: '#94a3b8'}}>VC</span>}
          {isMissing && <span className={styles.subBadge} style={{color: '#ef4444'}}>OUT</span>}
          {isIncoming && <span className={styles.subBadge} style={{color: '#22c55e'}}>IN</span>}
        </div>
        <div className={styles.playerPoints} style={{ color: p.live_points >= 6 ? '#22c55e' : p.live_points <= 2 ? '#ef4444' : '#38bdf8' }}>
          {p.live_points * (p.multiplier || 1)}
        </div>
        <div className={styles.playerPrice}>
          £{p.price}m {(p.bonus > 0 || p.bps > 15) && <span style={{color: '#fbbf24', marginLeft: '4px'}}>{p.bonus > 0 ? `+${p.bonus}B` : `${p.bps}bps`}</span>}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.projectionHeader} ${styles[status]}`}>
        <div className={styles.projectionLabel}>{getStatusLabel()}</div>
        <div className={styles.projectionValue}>
          {projectedTotal} <span className={styles.projectionSub}>
            {status === 'official' ? '(Final)' : '(Inc. Auto-Subs)'}
          </span>
        </div>
      </div>
      <div className={styles.pitch}>
        <div className={styles.row}>
          {getPlayersByPos(starters, 'FWD').map(p => renderPlayer(p, 'pitch'))}
        </div>
        <div className={styles.row}>
          {getPlayersByPos(starters, 'MID').map(p => renderPlayer(p, 'pitch'))}
        </div>
        <div className={styles.row}>
          {getPlayersByPos(starters, 'DEF').map(p => renderPlayer(p, 'pitch'))}
        </div>
        <div className={styles.row}>
          {getPlayersByPos(starters, 'GKP').map(p => renderPlayer(p, 'pitch'))}
        </div>
      </div>
      
      <div className={styles.bench}>
        <h3 className={styles.benchTitle}>Substitutes</h3>
        <div className={styles.row} style={{ justifyContent: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
          {bench.map(p => renderPlayer(p, 'bench'))}
        </div>
      </div>
    </div>
  );
}
