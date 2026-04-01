'use client';

import { useEffect, useState } from 'react';
import styles from './CaptaincyAdviser.module.css';
import { getPlayerPhotoUrl, TRANSPARENT_IMAGE_DATA_URI } from '../lib/playerImage';

interface Suggestion {
  id: number;
  name: string;
  photo: string;
  team: string;
  teamCode: number;
  clubForm: string;
  ict: string;
  form: string;
  fdr: number;
  opponent: string;
  isHome: boolean;
  score: number;
  role: string;
  confidence: number;
  isDGW?: boolean;
  isBGW?: boolean;
  fixtures?: any[];
}

export default function CaptaincyAdviser() {
  const [data, setData] = useState<{ suggestions: Suggestion[], transferTarget: Suggestion, activeGW: number, targetGW: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/squad/suggestions')
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.loading}>Generating FPL advice...</div>;
  if (!data || !data.suggestions || !data.suggestions.length) return null;

  const renderClubForm = (form: string) => (
    <div className={styles.formDots}>
      {form.split('').map((result, i) => (
        <span key={i} className={`${styles.formDot} ${styles[result.toLowerCase()]}`} title={result} />
      ))}
    </div>
  );

  const renderCard = (p: Suggestion, isTarget = false) => (
    <div key={p.id} className={`${styles.card} ${isTarget ? styles.targetCard : ''}`}>
      <div className={styles.cardHeader}>
        <span className={styles.roleTag}>{p.role}</span>
        <span className={styles.confidence}>{p.confidence}% confidence</span>
      </div>
      
      <div className={styles.playerSection}>
        <div className={styles.imageContainer}>
          <img 
            src={getPlayerPhotoUrl(p.photo, '110x140', p.id, p.teamCode)}
            alt={p.name}
            className={styles.playerImage}
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              if (img.src.includes('data:image/')) return;
              img.src = TRANSPARENT_IMAGE_DATA_URI;
            }}
          />
        </div>
        <div className={styles.playerMain}>
          <div className={styles.playerName}>
            {p.name || 'Unknown Player'}
            {p.isDGW && <span className={styles.dgwBadge}>x2</span>}
            {p.isBGW && <span className={styles.bgwBadge}>Blank</span>}
          </div>
          <div className={styles.teamRow}>
            {p.teamCode && (
              <img 
                src={`https://resources.premierleague.com/premierleague/badges/50/t${p.teamCode}.png`} 
                alt={p.team}
                className={styles.teamBadge}
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  if (img.src.includes('data:image/')) return;
                  img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                }}
              />
            )}
            <div className={styles.teamInfoCol}>
              <div className={styles.playerTeam}>{p.team || 'UNK'}</div>
              {p.clubForm && renderClubForm(p.clubForm)}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.fixtureLine}>
        {p.isBGW ? (
          <span style={{color: '#ef4444', fontWeight: 800}}>NO FIXTURE (BLANK)</span>
        ) : (
          <>
            vs {p.fixtures && p.fixtures.length > 0 
              ? p.fixtures.map(f => `${f.opponent} (${f.home ? 'H' : 'A'})`).join(' & ') 
              : p.opponent || 'TBD'}
            <span className={styles.fdrDot} style={{ background: p.fdr <= 2 ? '#22c55e' : p.fdr === 3 ? '#eab308' : '#ef4444' }} />
          </>
        )}
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Form</span>
          <span className={styles.statValue}>{p.form || '0.0'}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>ICT Index</span>
          <span className={styles.statValue}>{p.ict || '0.0'}</span>
        </div>
      </div>
      
      {isTarget && <div className={styles.targetNote}>Best player NOT in your squad for GW{data?.targetGW || data?.activeGW}</div>}
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.titleRow}>
        <h2 className={styles.title}>GW {data.targetGW} Captaincy Adviser</h2>
        <span className={styles.beta}>BETA</span>
      </div>
      
      <div className={styles.mainGrid}>
        {data.suggestions.map(s => renderCard(s))}
        {data.transferTarget && renderCard(data.transferTarget, true)}
      </div>
    </div>
  );
}
