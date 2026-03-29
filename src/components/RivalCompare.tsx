'use client';

import { useEffect, useState } from 'react';
import styles from './RivalCompare.module.css';

interface ComparisonPlayer {
  id: number;
  name: string;
  points: number;
  multiplier: number;
  position: number;
  rivalPoints?: number;
}

interface ComparisonData {
  myCaptain: ComparisonPlayer;
  rivalCaptain: ComparisonPlayer;
  differentials: ComparisonPlayer[];
  dangers: ComparisonPlayer[];
  common: ComparisonPlayer[];
}

export default function RivalCompare({ 
  myId, 
  rivalId, 
  rivalName,
  onClose 
}: { 
  myId: string; 
  rivalId: number; 
  rivalName: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/v1/leagues/compare?myId=${myId}&rivalId=${rivalId}`)
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [myId, rivalId]);

  if (loading) return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.loading}>Comparing squads...</div>
      </div>
    </div>
  );

  if (!data) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <h2 className={styles.title}>Head-to-Head Analysis</h2>
            <p className={styles.subtitle}>VS {rivalName}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.captainBattle}>
          <div className={styles.capGroup}>
            <span className={styles.capLabel}>My Captain</span>
            <span className={styles.capName}>{data.myCaptain.name} ({data.myCaptain.points})</span>
          </div>
          <div className={styles.vsCircle}>VS</div>
          <div className={styles.capGroup} style={{ alignItems: 'flex-end' }}>
            <span className={styles.capLabel}>Rival Captain</span>
            <span className={styles.capName}>{data.rivalCaptain.name} ({data.rivalCaptain.points})</span>
          </div>
        </div>

        <div className={styles.grid}>
          <div className={styles.column}>
            <h3 className={styles.colTitle} style={{ color: '#22c55e' }}>My Differentials</h3>
            <div className={styles.playerList}>
              {data.differentials.map(p => (
                <div key={p.id} className={styles.playerRow}>
                  <span className={styles.pName}>{p.name}</span>
                  <span className={styles.pPoints}>+{p.points}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.column}>
            <h3 className={styles.colTitle}>Common Ground</h3>
            <div className={styles.playerList}>
              {data.common.map(p => (
                <div key={p.id} className={styles.playerRow} style={{ opacity: 0.6 }}>
                  <span className={styles.pName}>{p.name}</span>
                  <span className={styles.pPoints}>{p.points}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.column}>
            <h3 className={styles.colTitle} style={{ color: '#ef4444' }}>Dangers</h3>
            <div className={styles.playerList}>
              {data.dangers.map(p => (
                <div key={p.id} className={styles.playerRow}>
                  <span className={styles.pName}>{p.name}</span>
                  <span className={styles.pPoints} style={{ color: '#ef4444' }}>-{p.points}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
