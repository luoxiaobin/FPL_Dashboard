'use client';
import styles from './GwModeIndicator.module.css';
import type { GwMode } from '@/hooks/useGwMode';

interface Props {
  mode: GwMode;
  overridden?: boolean;
  onOverride: (next: GwMode) => void;
}

export default function GwModeIndicator({ mode, overridden = false, onOverride }: Props) {
  const isLive = mode === 'live';
  return (
    <button
      className={`${styles.badge} ${isLive ? styles.live : styles.planning} ${overridden ? styles.override : ''}`}
      onClick={() => onOverride(isLive ? 'planning' : 'live')}
      aria-label={`Mode: ${mode}${overridden ? ', manual override' : ''}. Tap to switch.`}
    >
      {isLive ? '● LIVE' : '○ PLANNING'}{overridden && <span className={styles.overrideText}> override</span>}
    </button>
  );
}
