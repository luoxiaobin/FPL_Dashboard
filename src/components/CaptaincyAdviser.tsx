'use client';

import { useEffect, useState } from 'react';
import styles from './CaptaincyAdviser.module.css';

interface Suggestion {
  id: number;
  name: string;
  team: string;
  ict: string;
  form: string;
  fdr: number;
  opponent: string;
  isHome: boolean;
  score: number;
  role: string;
  confidence: number;
}

export default function CaptaincyAdviser() {
  const [data, setData] = useState<{ suggestions: Suggestion[], transferTarget: Suggestion, activeGW: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/squad/suggestions')
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.loading}>Generating FPL advice...</div>;
  if (!data || !data.suggestions.length) return null;

  const renderCard = (p: Suggestion, isTarget = false) => (
    <div key={p.id} className={`${styles.card} ${isTarget ? styles.targetCard : ''}`}>
      <div className={styles.cardHeader}>
        <span className={styles.roleTag}>{p.role}</span>
        <span className={styles.confidence}>{p.confidence}% confidence</span>
      </div>
      
      <div className={styles.playerMain}>
        <div className={styles.playerName}>{p.name}</div>
        <div className={styles.playerTeam}>{p.team}</div>
      </div>

      <div className={styles.fixtureLine}>
        vs {p.opponent} ({p.isHome ? 'H' : 'A'}) 
        <span className={styles.fdrDot} style={{ background: p.fdr <= 2 ? '#22c55e' : p.fdr === 3 ? '#eab308' : '#ef4444' }} />
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Form</span>
          <span className={styles.statValue}>{p.form}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>ICT Index</span>
          <span className={styles.statValue}>{p.ict}</span>
        </div>
      </div>
      
      {isTarget && <div className={styles.targetNote}>Best player NOT in your squad for GW{data.activeGW}</div>}
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.titleRow}>
        <h2 className={styles.title}>GW {data.activeGW} Captaincy Adviser</h2>
        <span className={styles.beta}>BETA</span>
      </div>
      
      <div className={styles.mainGrid}>
        {data.suggestions.map(s => renderCard(s))}
        {data.transferTarget && renderCard(data.transferTarget, true)}
      </div>
    </div>
  );
}
