'use client';
import { useState, useEffect } from 'react';

export type GwMode = 'live' | 'planning';

const STORAGE_KEY = 'gw_mode_override';

export function getStoredModeOverride(): GwMode | null {
  try {
    const v = sessionStorage.getItem(STORAGE_KEY);
    return v === 'live' || v === 'planning' ? v : null;
  } catch {
    return null;
  }
}

export function setStoredModeOverride(mode: GwMode | null): void {
  try {
    if (mode === null) {
      sessionStorage.removeItem(STORAGE_KEY);
    } else {
      sessionStorage.setItem(STORAGE_KEY, mode);
    }
  } catch {
    // sessionStorage unavailable (SSR context) — no-op
  }
}

export function statusToMode(status: string | undefined): GwMode {
  return status === 'live' ? 'live' : 'planning';
}

export function useGwMode(): GwMode {
  const [mode, setMode] = useState<GwMode>('planning');

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch('/api/v1/user/summary');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setMode(statusToMode(data?.current_event_status));
      } catch {
        // stay on last known mode
      }
    }

    poll();
    const id = setInterval(poll, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return mode;
}
