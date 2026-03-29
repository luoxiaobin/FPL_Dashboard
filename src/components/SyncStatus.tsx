'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './SyncStatus.module.css';

interface SyncProgress {
  step: string;
  message: string;
  done?: number;
  total?: number;
}

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;

export default function SyncStatus() {
  const [status, setStatus] = useState<SyncProgress | null>(null);
  const [visible, setVisible] = useState(true);
  const [complete, setComplete] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const lastDoneRef = useRef(0);

  useEffect(() => {
    if (complete) return;

    const url = lastDoneRef.current > 0
      ? `/api/v1/sync?from=${lastDoneRef.current}`
      : '/api/v1/sync';

    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      const data: SyncProgress = JSON.parse(event.data);
      setStatus(data);
      if (data.done != null) lastDoneRef.current = data.done;

      if (data.step === 'complete' || data.step === 'error') {
        setComplete(true);
        eventSource.close();
        setTimeout(() => setVisible(false), 4000);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      if (retryCount < MAX_RETRIES && !complete) {
        setRetryCount(r => r + 1);
        setStatus(prev => prev
          ? { ...prev, message: `Connection lost — retrying (${retryCount + 1}/${MAX_RETRIES})...` }
          : null
        );
        setTimeout(() => {}, RETRY_DELAY_MS); // triggers re-render via retryCount update
      } else {
        setStatus({ step: 'error', message: 'Sync failed after max retries' });
        setComplete(true);
        setTimeout(() => setVisible(false), 4000);
      }
    };

    return () => eventSource.close();
  }, [retryCount, complete]);

  if (!visible || !status) return null;

  const isError = status.step === 'error';
  const progressPct = status.total && status.done != null
    ? Math.round((status.done / status.total) * 100)
    : null;

  return (
    <div className={`${styles.toast} ${complete ? (isError ? styles.error : styles.success) : styles.syncing}`}>
      <div className={styles.toastHeader}>
        <span className={styles.icon}>
          {isError ? '❌' : complete ? '✅' : '🔄'}
        </span>
        <span className={styles.label}>
          {isError ? 'Sync Failed' : complete ? 'Sync Complete!' : 'Syncing to Database'}
        </span>
        <button className={styles.close} onClick={() => setVisible(false)}>✕</button>
      </div>

      <p className={styles.message}>{status.message}</p>

      {progressPct !== null && !complete && (
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
        </div>
      )}

      {status.total && status.done != null && !complete && (
        <p className={styles.progressLabel}>{status.done} / {status.total} gameweeks</p>
      )}
    </div>
  );
}
