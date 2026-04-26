'use client';

import { useEffect, useState } from 'react';
import styles from './FixtureTicker.module.css';
import { getPlayerPhotoUrl, TRANSPARENT_IMAGE_DATA_URI } from '../lib/playerImage';

interface Fixture {
  gw: number;
  opponent: string;
  difficulty: number;
  home: boolean;
  isDGW?: boolean;
}

interface PlayerFixtures {
  id: number;
  name: string;
  photo: string;
  teamCode: number;
  club: string;
  clubForm: string;
  teamShort: string;
  teamForm: string;
  role: string;
  status: string | null;
  chance: number | null;
  position: number;
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
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/v1/fixtures')
      .then(res => res.json())
      .then(d => {
        if (d && !d.error) setData(d);
        else setError(true);
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  if (loading) return (
    <div className={styles.container}>
      <div className={styles.loading}>Loading fixture ticker...</div>
    </div>
  );

  if (error || !data || !data.players?.length) return null;

  const startingXI = data.players.filter(p => p.position <= 11);
  const bench = data.players.filter(p => p.position > 11);
  const hasDoubleGameweek = data.players.some(player =>
    data.nextGWs.some(gw => player.fixtures.filter(f => f.gw === gw).length > 1)
  );
  const hasBlankGameweek = data.players.some(player =>
    data.nextGWs.some(gw => !player.fixtures.some(f => f.gw === gw))
  );
  const showNoSpecialWeeksIndicator = !hasDoubleGameweek && !hasBlankGameweek;

  const getFormColor = (form: string) => {
    const f = parseFloat(form);
    if (isNaN(f)) return '#94a3b8';
    if (f >= 5.0) return '#22c55e';
    if (f >= 4.0) return '#38bdf8';
    if (f < 2.0) return '#f97316';
    return '#94a3b8';
  };

  const renderClubForm = (form: string) => (
    <div className={styles.formDots}>
      {form.split('').map((result, i) => (
        <span key={i} className={`${styles.formDot} ${styles[result.toLowerCase()]}`} title={result} />
      ))}
    </div>
  );

  const renderPlayerRow = (player: PlayerFixtures) => (
    <tr key={player.id} className={styles.row}>
      <td className={styles.playerCell}>
        <div className={styles.playerMainInfo}>
          <div className={styles.avatarMini}>
            <img 
              src={getPlayerPhotoUrl(player.photo, '110x140', player.id, player.teamCode)}
              alt={player.name}
              className={styles.avatarImg}
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                if (img.src.includes('data:image/')) return;
                img.src = TRANSPARENT_IMAGE_DATA_URI;
              }}
            />
          </div>
          <div className={styles.playerText}>
            <span className={styles.playerName}>{player.name || 'Unknown'}</span>
            <div className={styles.playerMeta}>
              <span className={styles.roleTag}>{player.role}</span>
              <div className={styles.clubBadgeRow}>
                {player.teamCode && (
                  <img 
                    src={`https://resources.premierleague.com/premierleague/badges/50/t${player.teamCode}.png`} 
                    alt={player.club}
                    className={styles.clubBadgeImg}
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      if (img.src.includes('data:image/')) return;
                      img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                    }}
                  />
                )}
                <div className={styles.clubInfoCol}>
                  <span className={styles.clubBadgeText}>{player.club || 'UNK'}</span>
                  {player.clubForm && renderClubForm(player.clubForm)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </td>
      <td className={styles.centerCell}>
        <div 
          className={styles.formBadge}
          style={{ 
            color: getFormColor(player.teamForm),
            borderColor: getFormColor(player.teamForm),
            background: `${getFormColor(player.teamForm)}11`
          }}
        >
          {player.teamForm}
        </div>
      </td>
      <td className={styles.centerCell}>
        {player.status ? (
          <div 
            className={styles.statusIcon} 
            title={player.status}
            style={{ color: player.chance === 0 ? '#ef4444' : '#eab308' }}
          >
            ⚠ {player.chance !== null && `${player.chance}%`}
          </div>
        ) : (
          <div className={styles.statusOk}>✔</div>
        )}
      </td>
      {data.nextGWs.map(gw => {
        const fixturesForGw = player.fixtures.filter(f => f.gw === gw);
        return (
          <td key={gw} className={styles.fixCell}>
            {fixturesForGw.length > 0 ? (
              <div className={styles.fixStack}>
                {fixturesForGw.map((fix, index) => (
                  <div
                    key={`${gw}-${fix.opponent}-${index}`}
                    className={styles.fixChip}
                    style={{ background: difficultyColor(fix.difficulty) }}
                    title={`GW${gw}: ${fix.opponent} (${fix.home ? 'H' : 'A'}) - Difficulty ${fix.difficulty}`}
                  >
                    {fix.opponent}
                    <span className={styles.venue}>{fix.home ? 'H' : 'A'}</span>
                    {index === 0 && fixturesForGw.length > 1 && <span className={styles.dgwIndicator}>x2</span>}
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.blankChip}>—</div>
            )}
          </td>
        );
      })}
    </tr>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Squad Fixture Ticker</h2>
        <div className={styles.headerMeta}>
          {showNoSpecialWeeksIndicator && (
            <span className={styles.windowIndicator}>No DGW/BGW in next 5 GWs</span>
          )}
          <div className={styles.gwLabels}>
            {data.nextGWs.map(gw => (
              <span key={gw} className={styles.gwLabel}>GW{gw}</span>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.playerCol}>Player / Club</th>
              <th className={styles.gwCol} title="30-day Rolling Avg Pts">Form</th>
              <th className={styles.gwCol}>Status</th>
              {data.nextGWs.map(gw => <th key={gw} className={styles.gwCol}>GW{gw}</th>)}
            </tr>
          </thead>
          <tbody>
            {startingXI.map(renderPlayerRow)}
            {bench.length > 0 && (
              <>
                <tr className={styles.benchDivider}>
                  <td colSpan={data.nextGWs.length + 3}>Bench</td>
                </tr>
                {bench.map(renderPlayerRow)}
              </>
            )}
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
