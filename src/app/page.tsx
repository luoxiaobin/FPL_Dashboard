'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import LivePoints from '../components/LivePoints';
import LeagueStandings from '../components/LeagueStandings';
import SquadPitch from '../components/SquadPitch';
import HistoryChart from '../components/HistoryChart';
import GameweekHistory from '../components/GameweekHistory';

export default function DashboardShell() {
  const [summary, setSummary] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/v1/user/summary')
      .then(async (res) => {
        if (res.status === 401) {
          router.push('/login');
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data && !data.error) {
          setSummary(data);
        }
      });
  }, [router]);
  const handleLogout = async () => {
    await fetch('/api/v1/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          {summary ? summary.team_name : 'Loading Team...'}
        </h1>
        <button 
          onClick={handleLogout}
          className="glass-panel" 
          style={{ 
            padding: '10px 20px', 
            borderRadius: '30px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
            e.currentTarget.style.border = '1px solid rgba(239, 68, 68, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            e.currentTarget.style.border = '1px solid rgba(239, 68, 68, 0.2)';
          }}
        >
          Sign Out
        </button>
      </header>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Overall Rank</div>
          <div className={styles.statValue}>
            {summary?.overall_rank.toLocaleString() ?? '-'}
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Points</div>
          <div className={styles.statValue}>
            {summary?.total_points.toLocaleString() ?? '-'}
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Bank Balance</div>
          <div className={styles.statValue}>
            £{summary?.bank_balance.toFixed(1) ?? '-'}m
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Transfers</div>
          <div className={styles.statValue}>
            {summary?.transfers_available ?? '-'}
          </div>
        </div>
      </div>

      <HistoryChart />
      <GameweekHistory />

      <div className={styles.mainGrid}>
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>Live Squad Pitch</h2>
          <SquadPitch />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>Live Points</h2>
            <LivePoints />
          </div>

          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>League Standings</h2>
            <LeagueStandings />
          </div>
        </div>
      </div>
    </div>
  );
}
