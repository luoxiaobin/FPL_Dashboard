'use client';

import { useEffect, useState } from 'react';
import styles from './SyncStatus.module.css';

interface SyncProgress {
  step: string;
  message: string;
  done?: number;
  total?: number;
}

export default function SyncStatus() {
  const [status, setStatus] = useState<SyncProgress | null>(null);
  const [visible, setVisible] = useState(false);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource('/api/v1/sync');
    setVisible(true);

    eventSource.onmessage = (event) => {
      const data: SyncProgress = JSON.parse(event.data);
      setStatus(data);

      if (data.step === 'complete' || data.step === 'error') {
        setComplete(true);
        eventSource.close();
        // Auto-dismiss after 4 seconds
        setTimeout(() => setVisible(false), 4000);
      }
    };

    eventSource.onerror = () => {
      setStatus({ step: 'error', message: 'Sync connection lost' });
      setComplete(true);
      eventSource.close();
      setTimeout(() => setVisible(false), 4000);
    };

    return () => eventSource.close();
  }, []);

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
