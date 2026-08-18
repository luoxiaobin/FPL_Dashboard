'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import GwLive from '../components/GwLive';
import LeagueStandings from '../components/LeagueStandings';
import LeagueLive from '../components/LeagueLive';
import HistoryChart from '../components/HistoryChart';
import GameweekHistory from '../components/GameweekHistory';
import SyncStatus from '../components/SyncStatus';
import RankProjection from '../components/RankProjection';
import FixtureTicker from '../components/FixtureTicker';
import TransferAnalyser from '../components/TransferAnalyser';
import CaptaincyAdviser from '../components/CaptaincyAdviser';
import TransferOptimizer from '../components/TransferOptimizer';
import GwModeIndicator from '../components/GwModeIndicator';
import { DEFAULT_SECTION_PREFERENCES, SECTION_KEYS, SectionPreferences } from '@/lib/sectionPreferences';
import {
  PanelKey,
  PLANNING_DEFAULT_ORDER,
  LIVE_DEFAULT_ORDER,
  mergeOrder,
} from '@/lib/panelOrder';
import {
  useGwMode,
  GwMode,
  getStoredModeOverride,
  setStoredModeOverride,
} from '@/hooks/useGwMode';

interface UserSummary {
  manager_name: string;
  team_name: string;
  overall_rank: number;
  total_players: number;
  bank_balance: number;
  total_value: number;
  transfers_available: number;
  current_event_status?: string;
}

interface LiveSquadData {
  gameweek: number;
  status: 'live' | 'provisional' | 'official';
  projected_points: number;
}

export default function DashboardShell() {
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'error'>('checking');
  const [summary, setSummary] = useState<UserSummary | null>(null);
  const [liveSquad, setLiveSquad] = useState<LiveSquadData | null>(null);
  const [viewingLeagueId, setViewingLeagueId] = useState<number | null>(null);
  const [sections, setSections] = useState<SectionPreferences>(DEFAULT_SECTION_PREFERENCES);
  const [planningOrder, setPlanningOrder] = useState<PanelKey[]>(PLANNING_DEFAULT_ORDER);
  const [liveOrder, setLiveOrder] = useState<PanelKey[]>(LIVE_DEFAULT_ORDER);
  const [modeOverride, setModeOverride] = useState<GwMode | null>(() => getStoredModeOverride());
  const router = useRouter();
  const autoMode = useGwMode(authStatus === 'authenticated');
  const effectiveMode: GwMode = modeOverride ?? autoMode;

  const handleOverride = useCallback((next: GwMode) => {
    setStoredModeOverride(next);
    setModeOverride(next);
  }, []);

  const getScoreLabel = () => {
    if (!liveSquad?.gameweek) return 'Score';
    switch (liveSquad.status) {
      case 'official': return `GW${liveSquad.gameweek} Official Score`;
      case 'provisional': return `GW${liveSquad.gameweek} Provisional Score`;
      default: return `GW${liveSquad.gameweek} Live Score`;
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboard() {
      try {
        const summaryResponse = await fetch('/api/v1/user/summary', { signal: controller.signal });
        if (summaryResponse.status === 401) {
          router.replace('/login');
          return;
        }
        if (!summaryResponse.ok) throw new Error(`Summary request failed (${summaryResponse.status})`);

        const summaryData = await summaryResponse.json();
        if (summaryData?.error) throw new Error(summaryData.error);
        setSummary(summaryData);
        setAuthStatus('authenticated');

        const [squadResult, preferencesResult] = await Promise.allSettled([
          fetch('/api/v1/squad/live', { signal: controller.signal }).then(res => res.json()),
          fetch('/api/v1/user/preferences', { signal: controller.signal }).then(res => res.json()),
        ]);

        if (squadResult.status === 'fulfilled' && !squadResult.value?.error) {
          setLiveSquad(squadResult.value);
        }

        if (preferencesResult.status === 'fulfilled') {
          const data = preferencesResult.value;
          if (data?.preferences) setSections(data.preferences);
          if (Array.isArray(data?.planning_panel_order) && data.planning_panel_order.length > 0) {
            setPlanningOrder(mergeOrder(data.planning_panel_order, PLANNING_DEFAULT_ORDER));
          }
          if (Array.isArray(data?.live_panel_order) && data.live_panel_order.length > 0) {
            setLiveOrder(mergeOrder(data.live_panel_order, LIVE_DEFAULT_ORDER));
          }
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        console.error('Failed to load dashboard:', error);
        setAuthStatus('error');
      }
    }

    void loadDashboard();
    return () => controller.abort();
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/v1/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const isSectionVisible = (key: PanelKey): boolean => {
    if ((SECTION_KEYS as readonly string[]).includes(key)) {
      return sections[key as keyof SectionPreferences] !== false;
    }
    return true;
  };

  const renderPanel = (key: PanelKey): React.ReactNode => {
    if (!isSectionVisible(key)) return null;

    switch (key) {
      case 'syncStatus':
        return <SyncStatus key="syncStatus" />;

      case 'gwLive':
      case 'livePoints':
      case 'squadPitch':
        return <GwLive key="gwLive" />;

      case 'captaincyAdviser':
        return <CaptaincyAdviser key="captaincyAdviser" />;

      case 'transferOptimizer':
        return <TransferOptimizer key="transferOptimizer" />;

      case 'transferAnalyser':
        return <TransferAnalyser key="transferAnalyser" />;

      case 'rankProjection':
        return <RankProjection key="rankProjection" />;

      case 'leagueStandings':
      case 'leagueLive':
        return (
          <div key="leagueStandings" className={styles.panel}>
            <h2 className={styles.panelTitle}>
              {viewingLeagueId ? 'Live Standings' : 'League Standings'}
            </h2>
            {viewingLeagueId ? (
              <LeagueLive leagueId={viewingLeagueId} onBack={() => setViewingLeagueId(null)} />
            ) : (
              <LeagueStandings onViewLive={(id) => setViewingLeagueId(id)} />
            )}
          </div>
        );

      case 'historyChart':
        return <HistoryChart key="historyChart" />;

      case 'gameweekHistory':
        return <GameweekHistory key="gameweekHistory" />;

      case 'fixtureTicker':
        return <FixtureTicker key="fixtureTicker" />;

      case 'rivalCompare':
        // RivalCompare is triggered from LeagueStandings, not a standalone panel
        return null;

      default:
        return null;
    }
  };

  const currentOrder = effectiveMode === 'live' ? liveOrder : planningOrder;

  if (authStatus !== 'authenticated') {
    return (
      <main className={styles.container} aria-busy={authStatus === 'checking'}>
        <p role="status">
          {authStatus === 'error'
            ? 'Unable to load the dashboard. Please refresh and try again.'
            : 'Loading dashboard…'}
        </p>
      </main>
    );
  }

  // Deduplicate: merged panels share one render slot
  const renderedKeys = new Set<string>();
  const panelNodes = currentOrder
    .filter(key => {
      const slot =
        key === 'leagueLive' ? 'leagueStandings' :
        (key === 'livePoints' || key === 'squadPitch') ? 'gwLive' :
        key;
      if (renderedKeys.has(slot)) return false;
      renderedKeys.add(slot);
      return true;
    })
    .map(key => renderPanel(key));

  return (
    <div className={styles.container}>
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
          <GwModeIndicator mode={effectiveMode} onOverride={handleOverride} />
          <button
            onClick={() => router.push('/settings')}
            className={styles.settingsBtn}
            title="Dashboard Settings"
          >
            ⚙
          </button>
          <button onClick={handleLogout} className={styles.signOutBtn}>
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
          <div className={styles.statLabel} style={{ color: '#22c55e' }}>{getScoreLabel()}</div>
          <div className={styles.statValue} style={{ color: '#22c55e' }}>
            {liveSquad?.projected_points ?? '-'}
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Bank Balance</div>
          <div className={styles.statValue}>£{summary?.bank_balance.toFixed(1) ?? '-'}m</div>
          <div className={styles.statBadge}>
            Team Value: £{summary?.total_value?.toFixed(1) ?? '-'}m
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Transfers</div>
          <div className={styles.statValue}>{summary?.transfers_available ?? '-'}</div>
        </div>
      </div>

      {panelNodes}
    </div>
  );
}
