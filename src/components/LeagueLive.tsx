'use client';

import { useEffect, useState } from 'react';
import styles from './LeagueLive.module.css';
import RivalCompare from './RivalCompare';

interface LeagueRival {
  entry: number;
  player_name: string;
  entry_name: string;
  rank: number;
  live_rank: number;
  gw_points: number;
  live_total: number;
  movement: number;
  hits: number;
}

interface LeagueData {
  league_name: string;
  standings: LeagueRival[];
  total_entries: number;
}

export default function LeagueLive({ leagueId, onBack }: { leagueId: number; onBack: () => void }) {
  const [data, setData] = useState<LeagueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [compareRival, setCompareRival] = useState<{ id: number; name: string } | null>(null);

  const getMyEntryId = () => {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('fpl_entry_id='))
      ?.split('=')[1];
  };

  const myEntryId = getMyEntryId();

  useEffect(() => {
    fetch(`/api/v1/leagues/live?id=${leagueId}`)
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [leagueId]);

  if (loading) return (
    <div className={styles.container}>
      <div className={styles.loading}>Calculating live standings for {leagueId}...</div>
    </div>
  );

  if (!data) return null;

  return (
    <div className={styles.container}>
      {compareRival && myEntryId && (
        <RivalCompare 
          myId={myEntryId}
          rivalId={compareRival.id}
          rivalName={compareRival.name}
          onClose={() => setCompareRival(null)}
        />
      )}

      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>← All Leagues</button>
        <h2 className={styles.title}>{data.league_name} <span className={styles.liveBadge}>LIVE</span></h2>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.rankCol}>#</th>
              <th className={styles.playerCol}>Manager / Team</th>
              <th>GW Pts</th>
              <th>Total</th>
              <th>Move</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.standings.map((rival) => (
              <tr key={rival.entry} className={styles.row}>
                <td className={styles.rankCell}>
                  <div className={styles.rank}>
                    {rival.live_rank}
                    <span className={styles.percentBadge}>
                      (Top {((rival.live_rank / (data.total_entries || 1)) * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <div className={styles.oldRank}>was {rival.rank}</div>
                </td>
                <td className={styles.playerCell}>
                  <span className={styles.teamName}>{rival.entry_name}</span>
                  <span className={styles.playerName}>{rival.player_name}</span>
                </td>
                <td className={styles.pointsCell}>
                  {rival.gw_points}
                  {rival.hits > 0 && <span className={styles.hitLabel}>-{rival.hits}</span>}
                </td>
                <td className={styles.totalCell}>{rival.live_total}</td>
                <td className={rival.movement > 0 ? styles.up : rival.movement < 0 ? styles.down : styles.same}>
                  {rival.movement > 0 ? `▲${rival.movement}` : rival.movement < 0 ? `▼${Math.abs(rival.movement)}` : '—'}
                </td>
                <td>
                  <button 
                    className={styles.compareBtn}
                    onClick={() => setCompareRival({ id: rival.entry, name: rival.player_name })}
                  >
                    Compare
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
