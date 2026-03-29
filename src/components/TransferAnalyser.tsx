'use client';

import { useEffect, useState } from 'react';
import styles from './TransferAnalyser.module.css';

interface Transfer {
  id: string;
  gw: number;
  time: string;
  playerIn: string;
  playerOut: string;
  costIn: number;
  costOut: number;
}

export default function TransferAnalyser() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch('/api/v1/user/transfers')
      .then(res => res.json())
      .then(data => {
        if (data.transfers) setTransfers(data.transfers);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.loading}>Analysing transfers...</div>;
  if (!transfers.length) return null;

  const displayTransfers = expanded ? transfers : transfers.slice(0, 5);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Transfer Analyser</h2>
        <button className={styles.toggleBtn} onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Show Less ▲' : `View All ${transfers.length} Transfers ▼`}
        </button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>GW</th>
              <th>Player In</th>
              <th>Player Out</th>
              <th>Net Spend</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {displayTransfers.map((t) => {
              const netSpend = (t.costIn - t.costOut).toFixed(1);
              return (
                <tr key={t.id} className={styles.row}>
                  <td className={styles.gw}>GW {t.gw}</td>
                  <td className={styles.playerIn}>
                    <span className={styles.arrowIn}>↓</span> {t.playerIn}
                    <span className={styles.price}>£{t.costIn}m</span>
                  </td>
                  <td className={styles.playerOut}>
                    <span className={styles.arrowOut}>↑</span> {t.playerOut}
                    <span className={styles.price}>£{t.costOut}m</span>
                  </td>
                  <td className={parseFloat(netSpend) > 0 ? styles.positiveSub : styles.negativeSub}>
                    {parseFloat(netSpend) > 0 ? `+£${netSpend}m` : `£${netSpend}m`}
                  </td>
                  <td className={styles.time}>{new Date(t.time).toLocaleDateString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
