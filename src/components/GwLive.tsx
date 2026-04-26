'use client';

import { useEffect, useState } from 'react';
import styles from './GwLive.module.css';
import { getPlayerPhotoUrl, TRANSPARENT_IMAGE_DATA_URI } from '../lib/playerImage';

type GwStatus = 'live' | 'provisional' | 'official';
type Tab = 'pitch' | 'list';

interface Player {
  id: number;
  name: string;
  position: string;
  official_pos: number;
  multiplier: number;
  live_points: number;
  bps: number;
  bonus: number;
  is_captain: boolean;
  is_vice_captain: boolean;
  minutes: number;
  price: number;
  is_finished: boolean;
  was_started: boolean;
  photo: string;
  teamCode: number;
  clubForm: string;
}

interface SquadData {
  gameweek: number;
  status: GwStatus;
  players: Player[];
  projected_points: number;
}

const pointsColor = (pts: number) =>
  pts >= 6 ? '#22c55e' : pts <= 2 ? '#ef4444' : '#38bdf8';

export default function GwLive() {
  const [data, setData] = useState<SquadData | null>(null);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<Tab>('pitch');

  useEffect(() => {
    fetch('/api/v1/squad/live')
      .then(res => res.json())
      .then(d => { if (d && !d.error) setData(d); else setError(true); })
      .catch(() => setError(true));
  }, []);

  if (error) return null;
  if (!data) return <div className={styles.loading}>Loading Squad...</div>;

  const players = [...data.players].sort((a, b) => a.official_pos - b.official_pos);
  const starters = players.filter(p => p.was_started);
  const bench    = players.filter(p => !p.was_started);

  const missingStarters = starters.filter(p => p.minutes === 0 && p.is_finished);
  const subsIn: number[] = [];
  const availableBench = [...bench];
  missingStarters.forEach(() => {
    const idx = availableBench.findIndex(p => p.minutes > 0 || !p.is_finished);
    if (idx !== -1) { subsIn.push(availableBench[idx].id); availableBench.splice(idx, 1); }
  });

  const projectedTotal = starters.reduce((acc, p) => {
    if (missingStarters.find(m => m.id === p.id)) return acc;
    return acc + p.live_points * (p.multiplier || 1);
  }, 0) + bench.filter(p => subsIn.includes(p.id)).reduce((acc, p) => acc + p.live_points, 0);

  const statusLabel = data.status === 'official' ? 'OFFICIAL POINTS'
    : data.status === 'provisional' ? 'PROVISIONAL SCORE'
    : 'LIVE PROJECTED POINTS';

  const notYetPlayed = (p: Player) => !p.is_finished && p.minutes === 0;
  const displayPts   = (p: Player) => notYetPlayed(p) ? null : p.live_points * (p.multiplier || 1);

  const getByPos = (list: Player[], pos: string) => list.filter(p => p.position === pos);

  // ── Shared header ─────────────────────────────────────────────────────────
  const header = (
    <div className={`${styles.projectionHeader} ${styles[data.status]}`}>
      <div className={styles.projectionLabel}>{statusLabel}</div>
      <div className={styles.projectionValue} data-testid="gw-projected-total">
        {projectedTotal}
        <span className={styles.projectionSub}>
          {data.status === 'official' ? '(Final)' : '(Inc. Auto-Subs)'}
        </span>
      </div>
    </div>
  );

  // ── Pitch card ─────────────────────────────────────────────────────────────
  const renderCard = (p: Player) => {
    const missing    = !!missingStarters.find(m => m.id === p.id);
    const incoming   = subsIn.includes(p.id);
    const unplayed   = notYetPlayed(p);
    const pts        = displayPts(p);
    const vcVisible  = p.is_vice_captain && !starters.find(s => s.is_captain && s.minutes > 0);

    return (
      <div key={p.id} className={`${styles.card} ${missing ? styles.dimmed : ''} ${incoming ? styles.highlight : ''}`}>
        <div className={styles.cardImg}>
          <img
            src={getPlayerPhotoUrl(p.photo, '110x140', p.id, p.teamCode)}
            alt={p.name}
            className={styles.cardImgEl}
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              if (!img.src.includes('data:image/')) img.src = TRANSPARENT_IMAGE_DATA_URI;
            }}
          />
        </div>
        <div className={styles.cardName}>
          {p.name}
          {p.is_captain  && <span className={styles.capTag}>C</span>}
          {vcVisible     && <span className={styles.capTag} style={{ background: '#94a3b8' }}>VC</span>}
          {missing       && <span className={styles.subBadge} style={{ color: '#ef4444' }}>OUT</span>}
          {incoming      && <span className={styles.subBadge} style={{ color: '#22c55e' }}>IN</span>}
        </div>
        <div
          data-testid="player-points"
          className={styles.cardPts}
          style={{ color: unplayed ? '#475569' : pointsColor(p.live_points) }}
        >
          {pts === null ? '—' : pts}
        </div>
        <div className={styles.cardPrice}>
          £{p.price}m
          {(p.bonus > 0 || p.bps > 15) && (
            <span style={{ color: '#fbbf24', marginLeft: 4 }}>
              {p.bonus > 0 ? `+${p.bonus}B` : `${p.bps}bps`}
            </span>
          )}
        </div>
      </div>
    );
  };

  // ── List row ───────────────────────────────────────────────────────────────
  const renderRow = (p: Player) => {
    const unplayed = notYetPlayed(p);
    const pts      = displayPts(p);
    const vcVisible = p.is_vice_captain && !starters.find(s => s.is_captain && s.minutes > 0);

    return (
      <div key={p.id} className={styles.listRow}>
        <div className={styles.listImg}>
          <img
            src={getPlayerPhotoUrl(p.photo, '40x40', p.id, p.teamCode)}
            alt={p.name}
            className={styles.listImgEl}
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              if (!img.src.includes('data:image/')) img.src = TRANSPARENT_IMAGE_DATA_URI;
            }}
          />
        </div>
        <div className={styles.listInfo}>
          <div className={styles.listName}>
            {p.name}
            {p.is_captain  && <span className={styles.capTag}>C</span>}
            {vcVisible     && <span className={styles.capTag} style={{ background: '#94a3b8' }}>VC</span>}
          </div>
          <div className={styles.listMeta}>
            {p.position} • {p.minutes} mins{p.bps > 0 ? ` • ${p.bps} bps` : ''}
          </div>
        </div>
        <div className={styles.listPtsBlock}>
          {p.bonus > 0 && <span className={styles.bonusTag}>+{p.bonus}</span>}
          <span
            data-testid="list-player-points"
            className={styles.listPts}
            style={{ color: unplayed ? '#475569' : pointsColor(p.live_points) }}
          >
            {pts === null ? '—' : pts}
          </span>
        </div>
      </div>
    );
  };

  // ── Pitch view ─────────────────────────────────────────────────────────────
  const pitchView = (
    <>
      <div className={styles.pitch}>
        <div className={styles.pitchRow}>{getByPos(starters, 'FWD').map(renderCard)}</div>
        <div className={styles.pitchRow}>{getByPos(starters, 'MID').map(renderCard)}</div>
        <div className={styles.pitchRow}>{getByPos(starters, 'DEF').map(renderCard)}</div>
        <div className={styles.pitchRow}>{getByPos(starters, 'GKP').map(renderCard)}</div>
      </div>
      <div className={styles.bench}>
        <h3 className={styles.benchTitle}>Substitutes</h3>
        <div className={styles.benchRow}>{bench.map(renderCard)}</div>
      </div>
    </>
  );

  // ── List view ──────────────────────────────────────────────────────────────
  const sortedStarters = [...starters].sort((a, b) => {
    const pA = displayPts(a) ?? -1;
    const pB = displayPts(b) ?? -1;
    return pB - pA;
  });

  const listView = (
    <div className={styles.list}>
      {sortedStarters.map(renderRow)}
      {bench.length > 0 && (
        <>
          <div className={styles.listDivider}>Bench</div>
          {bench.map(renderRow)}
        </>
      )}
    </div>
  );

  return (
    <div className={styles.container}>
      {header}

      <div className={styles.tabs} role="tablist">
        {(['pitch', 'list'] as Tab[]).map(t => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'pitch' ? 'Pitch' : 'List'}
          </button>
        ))}
      </div>

      {tab === 'pitch' ? pitchView : listView}
    </div>
  );
}
