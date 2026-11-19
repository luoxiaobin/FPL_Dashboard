'use client';
import { useState, useEffect, useRef } from 'react';

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

export function isAutoModeTransition(previous: GwMode | null, next: GwMode): boolean {
  return previous !== null && previous !== next;
}

export function useGwMode(enabled = true, onAutoTransition?: (next: GwMode) => void): GwMode {
  const [mode, setMode] = useState<GwMode>('planning');
  const observedMode = useRef<GwMode | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch('/api/v1/user/summary');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          const next = statusToMode(data?.current_event_status);
          if (isAutoModeTransition(observedMode.current, next)) onAutoTransition?.(next);
          observedMode.current = next;
          setMode(next);
        }
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
  }, [enabled, onAutoTransition]);

  return mode;
}
