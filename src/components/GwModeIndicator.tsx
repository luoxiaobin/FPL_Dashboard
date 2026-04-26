'use client';
import styles from './GwModeIndicator.module.css';
import type { GwMode } from '@/hooks/useGwMode';

interface Props {
  mode: GwMode;
  onOverride: (next: GwMode) => void;
}

export default function GwModeIndicator({ mode, onOverride }: Props) {
  const isLive = mode === 'live';
  return (
    <button
      className={`${styles.badge} ${isLive ? styles.live : styles.planning}`}
      onClick={() => onOverride(isLive ? 'planning' : 'live')}
      aria-label={`Mode: ${mode}. Tap to switch.`}
    >
      {isLive ? '● LIVE' : '○ PLANNING'}
    </button>
  );
}
