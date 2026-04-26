'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import LivePoints from '../components/LivePoints';
import LeagueStandings from '../components/LeagueStandings';
import SquadPitch from '../components/SquadPitch';
import HistoryChart from '../components/HistoryChart';
import GameweekHistory from '../components/GameweekHistory';
import SyncStatus from '../components/SyncStatus';
import RankProjection from '../components/RankProjection';
import FixtureTicker from '../components/FixtureTicker';
import TransferAnalyser from '../components/TransferAnalyser';
import LeagueLive from '../components/LeagueLive';
import CaptaincyAdviser from '../components/CaptaincyAdviser';
import TransferOptimizer from '../components/TransferOptimizer';
import { DEFAULT_SECTION_PREFERENCES, SectionPreferences } from '@/lib/sectionPreferences';

interface UserSummary {
  manager_name: string;
  team_name: string;
  overall_rank: number;
  total_players: number;
  bank_balance: number;
  total_value: number;
  transfers_available: number;
}

interface LiveSquadData {
  gameweek: number;
  status: 'live' | 'provisional' | 'official';
  projected_points: number;
}

export default function DashboardShell() {
  const [summary, setSummary] = useState<UserSummary | null>(null);
  const [liveSquad, setLiveSquad] = useState<LiveSquadData | null>(null);
  const [viewingLeagueId, setViewingLeagueId] = useState<number | null>(null);
  const [sections, setSections] = useState<SectionPreferences>(DEFAULT_SECTION_PREFERENCES);
  const router = useRouter();

  const getScoreLabel = () => {
    if (!liveSquad?.gameweek) return 'Score';

    switch (liveSquad.status) {
      case 'official':
        return `GW${liveSquad.gameweek} Official Score`;
      case 'provisional':
        return `GW${liveSquad.gameweek} Provisional Score`;
      default:
        return `GW${liveSquad.gameweek} Live Score`;
    }
  };

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
        if (data && !data.error) setSummary(data);
      })
      .catch(err => console.error('Failed to load summary:', err));

    fetch('/api/v1/squad/live')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) setLiveSquad(data);
      })
      .catch(err => console.error('Failed to load live squad:', err));

    fetch('/api/v1/user/preferences')
      .then(res => res.json())
      .then(data => {
        if (data?.preferences) setSections(data.preferences);
      })
      .catch(err => console.error('Failed to load preferences:', err));
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/v1/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className={styles.container}>
      <SyncStatus />
      <header className={styles.header}>
        <div className={styles.branding}>
          <img
            src="/branding/logos/logo-final-full.svg"
            alt="FPL Dashboard"
            className={styles.logoFull}
          />
          <img
            src="/branding/logos/logo-final-icon.svg"
            alt="FPL Dashboard"
            className={styles.logoIcon}
          />
          <div className={styles.teamName}>
            {summary
              ? `FPL Manager: ${summary.manager_name || summary.team_name}`
              : 'FPL Manager: Loading...'}
          </div>
        </div>
        <div className={styles.headerActions}>
          <button
            onClick={() => router.push('/settings')}
            className={styles.settingsBtn}
            title="Dashboard Settings"
          >
            ⚙
          </button>
          <button
            onClick={handleLogout}
            className={styles.signOutBtn}
          >
            Sign Out
          </button>
        </div>
      </header>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Overall Rank</div>
          <div className={styles.statValue}>
            {summary?.overall_rank.toLocaleString() ?? '-'}
          </div>
          {summary?.overall_rank && summary?.total_players && (
            <div className={styles.statBadge}>
              Top {((summary.overall_rank / summary.total_players) * 100).toFixed(1)}%
            </div>
          )}
        </div>
        <div className={styles.statCard} style={{ border: '1px solid rgba(34, 197, 94, 0.3)', background: 'rgba(34, 197, 94, 0.05)' }}>
          <div className={styles.statLabel} style={{ color: '#22c55e' }}>
            {getScoreLabel()}
          </div>
          <div className={styles.statValue} style={{ color: '#22c55e' }}>
            {liveSquad?.projected_points ?? '-'}
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Bank Balance</div>
          <div className={styles.statValue}>
            £{summary?.bank_balance.toFixed(1) ?? '-'}m
          </div>
          <div className={styles.statBadge}>
            Team Value: £{summary?.total_value?.toFixed(1) ?? '-'}m
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Transfers</div>
          <div className={styles.statValue}>
            {summary?.transfers_available ?? '-'}
          </div>
        </div>
      </div>

      {sections.captaincyAdviser && <CaptaincyAdviser />}
      <TransferOptimizer />
      {sections.rankProjection && <RankProjection />}
      {sections.historyChart && <HistoryChart />}
      {sections.gameweekHistory && <GameweekHistory />}
      {sections.fixtureTicker && <FixtureTicker />}
      {sections.transferAnalyser && <TransferAnalyser />}

      <div className={styles.mainGrid}>
        {sections.squadPitch && (
          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>Live Squad Pitch</h2>
            <SquadPitch />
          </div>
        )}

        {(sections.livePoints || sections.leagueStandings) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {sections.livePoints && (
              <div className={styles.panel}>
                <h2 className={styles.panelTitle}>Live Points</h2>
                <LivePoints />
              </div>
            )}

            {sections.leagueStandings && (
              <div className={styles.panel}>
                <h2 className={styles.panelTitle}>
                  {viewingLeagueId ? 'Live Standings' : 'League Standings'}
                </h2>
                {viewingLeagueId ? (
                  <LeagueLive
                    leagueId={viewingLeagueId}
                    onBack={() => setViewingLeagueId(null)}
                  />
                ) : (
                  <LeagueStandings onViewLive={(id) => setViewingLeagueId(id)} />
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {!sections.squadPitch && !sections.livePoints && !sections.leagueStandings && (
        <div className={styles.emptyState}>
          All lower dashboard sections are hidden. Open Settings to re-enable modules.
        </div>
      )}
    </div>
  );
}
