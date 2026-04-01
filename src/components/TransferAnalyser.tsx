'use client';

import { useEffect, useState } from 'react';
import styles from './TransferAnalyser.module.css';
import { getPlayerPhotoUrl, TRANSPARENT_IMAGE_DATA_URI } from '../lib/playerImage';

interface Fixture {
  gw: number;
  opponent: string;
  difficulty: number;
  home: boolean;
}

interface Transfer {
  id: string;
  gw: number;
  time: string;
  playerIn: string;
  playerOut: string;
  photoIn: string;
  photoOut: string;
  teamCodeIn: number;
  teamCodeOut: number;
  costIn: number;
  costOut: number;
  pointsIn: number;
  pointsOut: number;
  pointsImpact: number;
  chip: string | null;
  hitCost: number;
  fixturesIn: Fixture[];
  fixturesOut: Fixture[];
}

const difficultyColor = (d: number) => {
  if (d <= 2) return '#22c55e';  // green
  if (d === 3) return '#eab308'; // yellow
  if (d === 4) return '#f97316'; // orange
  return '#ef4444';              // red
};

const FixtureTicker = ({ fixtures }: { fixtures: Fixture[] }) => (
  <div className={styles.fixtureTicker}>
    {fixtures.map((f, i) => (
      <div 
        key={i} 
        className={styles.fixChip} 
        style={{ background: difficultyColor(f.difficulty) }}
        title={`GW${f.gw}: ${f.opponent} (${f.home ? 'H' : 'A'})`}
      >
        {f.opponent}
      </div>
    ))}
    {fixtures.length === 0 && <span className={styles.noFix}>No upcoming games</span>}
  </div>
);

type SortKey = 'gw' | 'pointsImpact' | 'netSpend' | 'value';

export default function TransferAnalyser() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('gw');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetch('/api/v1/user/transfers')
      .then(res => res.json())
      .then(data => {
        if (data.transfers) setTransfers(data.transfers);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.loading}>Analysing transfers...</div>;
  if (!transfers.length) return null;

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sortedTransfers = [...transfers].sort((a, b) => {
    let valA = 0;
    let valB = 0;
    
    if (sortKey === 'gw') { valA = a.gw; valB = b.gw; }
    else if (sortKey === 'pointsImpact') { valA = a.pointsImpact; valB = b.pointsImpact; }
    else if (sortKey === 'netSpend') { valA = a.costIn - a.costOut; valB = b.costIn - b.costOut; }
    else if (sortKey === 'value') { valA = a.pointsImpact - a.hitCost; valB = b.pointsImpact - b.hitCost; }

    return sortDir === 'asc' ? valA - valB : valB - valA;
  });

  const displayTransfers = expanded ? sortedTransfers : sortedTransfers.slice(0, 5);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h2 className={styles.title}>Transfer Analyser</h2>
          <p className={styles.subtitle}>Ranking your transfer business by points impact</p>
        </div>
        <button className={styles.toggleBtn} onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Show Less ▲' : `View All ${transfers.length} Transfers ▼`}
        </button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th onClick={() => handleSort('gw')} className={styles.sortable}>GW {sortKey === 'gw' && (sortDir === 'asc' ? '▴' : '▾')}</th>
              <th>Player In</th>
              <th>Player Out</th>
              <th onClick={() => handleSort('value')} className={styles.sortable}>Value {sortKey === 'value' && (sortDir === 'asc' ? '▴' : '▾')}</th>
              <th onClick={() => handleSort('netSpend')} className={styles.sortable}>Net Spend {sortKey === 'netSpend' && (sortDir === 'asc' ? '▴' : '▾')}</th>
              <th>Actioned</th>
            </tr>
          </thead>
          <tbody>
            {displayTransfers.map((t) => {
              const netSpend = (t.costIn - t.costOut).toFixed(1);
              const trueValue = t.pointsImpact - t.hitCost;
              return (
                <tr key={t.id} className={styles.row}>
                  <td className={styles.gw}>
                    GW {t.gw}
                    {t.chip && <span className={styles.chipBadge}>{t.chip}</span>}
                  </td>
                  <td className={styles.playerIn}>
                    <div className={styles.playerRowInfo}>
                      <div className={styles.avatarMini}>
                        <img 
                          src={getPlayerPhotoUrl(t.photoIn, '40x40')}
                          alt={t.playerIn}
                          className={styles.avatarImg}
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            if (img.src.includes('data:image/')) return;
                            img.src = TRANSPARENT_IMAGE_DATA_URI;
                          }}
                        />
                      </div>
                      <div className={styles.playerText}>
                        <span className={styles.playerName}><span className={styles.arrowIn}>↓</span> {t.playerIn}</span>
                        <div className={styles.priceRow}>
                          <span className={styles.price}>£{t.costIn}m</span>
                          {t.teamCodeIn && (
                            <img 
                              src={`https://resources.premierleague.com/premierleague/badges/50/t${t.teamCodeIn}.png`} 
                              alt="Club Badge"
                              className={styles.miniClubBadge}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                    <FixtureTicker fixtures={t.fixturesIn} />
                  </td>
                  <td className={styles.playerOut}>
                    <div className={styles.playerRowInfo}>
                      <div className={styles.avatarMini}>
                        <img 
                          src={getPlayerPhotoUrl(t.photoOut, '40x40')}
                          alt={t.playerOut}
                          className={styles.avatarImg}
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            if (img.src.includes('data:image/')) return;
                            img.src = TRANSPARENT_IMAGE_DATA_URI;
                          }}
                        />
                      </div>
                      <div className={styles.playerText}>
                        <span className={styles.playerName}><span className={styles.arrowOut}>↑</span> {t.playerOut}</span>
                        <div className={styles.priceRow}>
                          <span className={styles.price}>£{t.costOut}m</span>
                          {t.teamCodeOut && (
                            <img 
                              src={`https://resources.premierleague.com/premierleague/badges/50/t${t.teamCodeOut}.png`} 
                              alt="Club Badge"
                              className={styles.miniClubBadge}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                    <FixtureTicker fixtures={t.fixturesOut} />
                  </td>
                  <td className={trueValue > 0 ? styles.gain : trueValue < 0 ? styles.loss : ''}>
                    <div className={styles.pointsGrid}>
                      <span className={styles.mainPoints}>
                        {trueValue > 0 ? '+' : ''}{trueValue}
                      </span>
                      <span className={styles.pointsSub}>
                        {t.pointsImpact} pts {t.hitCost > 0 && `(-${t.hitCost} hit)`}
                      </span>
                    </div>
                  </td>
                  <td className={parseFloat(netSpend) > 0 ? styles.positiveSub : styles.negativeSub}>
                    {parseFloat(netSpend) > 0 ? `+£${netSpend}m` : `£${netSpend}m`}
                  </td>
                  <td className={styles.time}>{new Date(t.time).toLocaleDateString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
