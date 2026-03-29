'use client';

import { useEffect, useState } from 'react';
import styles from './FixtureTicker.module.css';

interface Fixture {
  gw: number;
  opponent: string;
  difficulty: number;
  home: boolean;
}

interface PlayerFixtures {
  id: number;
  name: string;
  team: string;
  fixtures: Fixture[];
}

interface TickerData {
  gameweek: number;
  players: PlayerFixtures[];
  nextGWs: number[];
}

const difficultyColor = (d: number) => {
  if (d <= 2) return '#22c55e';  // easy - green
  if (d === 3) return '#eab308'; // medium - yellow
  if (d === 4) return '#f97316'; // hard - orange
  return '#ef4444';              // very hard - red
};

export default function FixtureTicker() {
  const [data, setData] = useState<TickerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/fixtures')
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className={styles.container}>
      <div className={styles.loading}>Loading fixture ticker...</div>
    </div>
  );

  if (!data || !data.players?.length) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Fixture Difficulty Ticker</h2>
        <div className={styles.gwLabels}>
          {data.nextGWs.map(gw => (
            <span key={gw} className={styles.gwLabel}>GW{gw}</span>
          ))}
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.playerCol}>Player</th>
              {data.nextGWs.map(gw => <th key={gw} className={styles.gwCol}>GW{gw}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.players.map(player => (
              <tr key={player.id} className={styles.row}>
                <td className={styles.playerCell}>
                  <span className={styles.playerName}>{player.name}</span>
                  <span className={styles.teamName}>{player.team}</span>
                </td>
                {data.nextGWs.map(gw => {
                  const fix = player.fixtures.find(f => f.gw === gw);
                  return (
                    <td key={gw} className={styles.fixCell}>
                      {fix ? (
                        <div
                          className={styles.fixChip}
                          style={{ background: difficultyColor(fix.difficulty) }}
                          title={`GW${gw}: ${fix.opponent} (${fix.home ? 'H' : 'A'}) - Difficulty ${fix.difficulty}`}
                        >
                          {fix.opponent}
                          <span className={styles.venue}>{fix.home ? 'H' : 'A'}</span>
                        </div>
                      ) : (
                        <div className={styles.blankChip}>—</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.legend}>
        <span style={{ color: '#22c55e' }}>● Easy</span>
        <span style={{ color: '#eab308' }}>● Medium</span>
        <span style={{ color: '#f97316' }}>● Hard</span>
        <span style={{ color: '#ef4444' }}>● Very Hard</span>
      </div>
    </div>
  );
}
