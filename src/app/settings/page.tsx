'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import {
  DEFAULT_SECTION_PREFERENCES,
  SECTION_KEYS,
  SECTION_LABELS,
  SectionKey,
  SectionPreferences,
} from '@/lib/sectionPreferences';
import {
  ALL_PANEL_KEYS,
  PLANNING_DEFAULT_ORDER,
  LIVE_DEFAULT_ORDER,
  PanelKey,
  mergeOrder,
  moveItem,
} from '@/lib/panelOrder';

const PANEL_LABELS: Record<PanelKey, string> = {
  syncStatus: 'Sync Status',
  gwLive: 'GW Live (Squad + Points)',
  livePoints: 'Live Points (legacy)',
  squadPitch: 'Live Squad Pitch (legacy)',
  captaincyAdviser: 'Captaincy Adviser',
  transferOptimizer: 'Transfer Optimizer',
  transferAnalyser: 'Transfer Analyser',
  rankProjection: 'Rank Projection',
  leagueStandings: 'League Standings',
  leagueLive: 'League Live',
  historyChart: 'Season History Chart',
  gameweekHistory: 'Gameweek History',
  fixtureTicker: 'Fixture Ticker',
  rivalCompare: 'Rival Compare',
};

type OrderTab = 'planning' | 'live';

export default function SettingsPage() {
  const router = useRouter();
  const [prefs, setPrefs] = useState<SectionPreferences>(DEFAULT_SECTION_PREFERENCES);
  const [planningOrder, setPlanningOrder] = useState<PanelKey[]>(PLANNING_DEFAULT_ORDER);
  const [liveOrder, setLiveOrder] = useState<PanelKey[]>(LIVE_DEFAULT_ORDER);
  const [activeTab, setActiveTab] = useState<OrderTab>('planning');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/user/preferences')
      .then(async (res) => {
        if (res.status === 401) {
          router.push('/login');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.preferences) setPrefs(data.preferences);
        if (Array.isArray(data.planning_panel_order) && data.planning_panel_order.length > 0) {
          setPlanningOrder(mergeOrder(data.planning_panel_order, PLANNING_DEFAULT_ORDER));
        }
        if (Array.isArray(data.live_panel_order) && data.live_panel_order.length > 0) {
          setLiveOrder(mergeOrder(data.live_panel_order, LIVE_DEFAULT_ORDER));
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  const enabledCount = useMemo(
    () => SECTION_KEYS.filter((key) => prefs[key]).length,
    [prefs]
  );

  const toggleSection = (key: SectionKey) => {
    setMessage(null);
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const resetDefaults = () => {
    setMessage(null);
    setPrefs(DEFAULT_SECTION_PREFERENCES);
    setPlanningOrder(PLANNING_DEFAULT_ORDER);
    setLiveOrder(LIVE_DEFAULT_ORDER);
  };

  const movePanel = (index: number, direction: 'up' | 'down') => {
    setMessage(null);
    if (activeTab === 'planning') {
      setPlanningOrder((prev) => moveItem(prev, index, direction));
    } else {
      setLiveOrder((prev) => moveItem(prev, index, direction));
    }
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/v1/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: prefs,
          planning_panel_order: planningOrder,
          live_panel_order: liveOrder,
        }),
      });

      if (!res.ok) throw new Error('Failed to save settings');
      setMessage('Preferences saved');
    } catch {
      setMessage('Unable to save preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.panel}>Loading settings...</div>
      </div>
    );
  }

  const currentOrder = activeTab === 'planning' ? planningOrder : liveOrder;

  return (
    <div className={styles.container}>
      <div className={styles.panel}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Dashboard Settings</h1>
            <p className={styles.subtitle}>Choose which sections appear on your home dashboard.</p>
          </div>
          <button className={styles.backBtn} onClick={() => router.push('/')}>Back</button>
        </div>

        <div className={styles.count}>Enabled sections: {enabledCount}/{SECTION_KEYS.length}</div>

        <div className={styles.grid}>
          {SECTION_KEYS.map((key) => (
            <label key={key} className={styles.item}>
              <span>{SECTION_LABELS[key]}</span>
              <input
                type="checkbox"
                checked={prefs[key]}
                onChange={() => toggleSection(key)}
              />
            </label>
          ))}
        </div>

        <h2 className={styles.orderTitle}>Panel Order</h2>
        <p className={styles.subtitle}>Drag panels into your preferred order for each mode.</p>

        <div className={styles.tabs} role="tablist">
          {(['planning', 'live'] as OrderTab[]).map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <ol className={styles.orderList}>
          {currentOrder.map((key, i) => (
            <li key={key} className={styles.orderItem}>
              <span className={styles.orderLabel}>{PANEL_LABELS[key] ?? key}</span>
              <div className={styles.orderBtns}>
                <button
                  className={styles.orderBtn}
                  aria-label={`Move ${PANEL_LABELS[key] ?? key} up`}
                  disabled={i === 0}
                  onClick={() => movePanel(i, 'up')}
                >
                  ↑
                </button>
                <button
                  className={styles.orderBtn}
                  aria-label={`Move ${PANEL_LABELS[key] ?? key} down`}
                  disabled={i === (currentOrder.length - 1)}
                  onClick={() => movePanel(i, 'down')}
                >
                  ↓
                </button>
              </div>
            </li>
          ))}
        </ol>

        <div className={styles.actions}>
          <button className={styles.secondaryBtn} onClick={resetDefaults}>Reset defaults</button>
          <button className={styles.primaryBtn} onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>

        {message && <div className={styles.message}>{message}</div>}
      </div>
    </div>
  );
}

// re-export so tests can import ALL_PANEL_KEYS if needed
export { ALL_PANEL_KEYS };
