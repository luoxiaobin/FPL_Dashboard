import { useEffect, useState } from 'react';
import styles from './PlanningWorkspace.module.css';

const labels = {
  out: 'Ruled out',
  expected_start: 'Expected to start',
  bench_only: 'Bench only',
  available_role_unknown: 'Available, role unclear',
  managed_minutes: 'Minutes may be managed',
  uncertain: 'Uncertain',
} as const;

interface NewsBatch {
  processed_at: string;
  model_name: string;
  signals: Array<{
    playerId: number;
    signal: keyof typeof labels;
    evidence: Array<{ url: string; publishedAt: string; quote: string }>;
  }>;
}

export default function TeamNews({ deadline, gameweek, relevantPlayers }: {
  deadline: string;
  gameweek: number;
  relevantPlayers: Record<number, string>;
}) {
  const [batch, setBatch] = useState<NewsBatch | null>();
  const [error, setError] = useState(false);

  useEffect(() => {
    let request: AbortController | undefined;
    function refresh() {
      request?.abort();
      const controller = new AbortController();
      request = controller;
      void fetch(`/api/v1/planning/team-news?deadline=${encodeURIComponent(deadline)}`, {
        signal: controller.signal, cache: 'no-store',
      }).then(async response => {
        if (!response.ok) throw new Error('Team news unavailable');
        const result = await response.json();
        if (!controller.signal.aborted) {
          setBatch(result.batch ?? null);
          setError(false);
        }
      }).catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    }
    refresh();
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      request?.abort();
    };
  }, [deadline]);

  const relevant = batch?.signals.filter(item => relevantPlayers[item.playerId]) ?? [];

  return (
    <section className={`${styles.detail} ${styles.teamNews}`} aria-labelledby="team-news-title">
      <div className={styles.explanationHeader}>
        <h2 id="team-news-title">GW{gameweek} Team News</h2>
        <span className={styles.modelAttribution}>Powered by {batch?.model_name ?? 'Claude Haiku 5.5'}</span>
      </div>
      <p className={styles.tradeoff}>Curated reports for your squad and suggested transfers. The news is shown alongside the planner’s projections.</p>
      {error && <p role="status">Could not refresh team news.</p>}
      {!error && batch === undefined && <p role="status">Loading team news…</p>}
      {!error && batch === null && <p>No curated batch has been published for GW{gameweek}.</p>}
      {batch && <>
        <p>Batch processed <time dateTime={batch.processed_at}>{new Date(batch.processed_at).toLocaleString()}</time></p>
        {relevant.length === 0 ? <p>No verified news signals in this batch for your squad or suggested transfers.</p> : (
          <ul className={styles.newsItems}>
            {relevant.map(item => <li key={item.playerId}>
              <strong>{relevantPlayers[item.playerId]} · {labels[item.signal]}</strong>
              {item.evidence.map((source, index) => (
                <div key={index}>
                  <p>“{source.quote}”</p>
                  <a href={source.url} target="_blank" rel="noopener noreferrer">View source</a>
                  {' · Published '}<time dateTime={source.publishedAt}>{new Date(source.publishedAt).toLocaleString()}</time>
                </div>
              ))}
            </li>)}
          </ul>
        )}
      </>}
    </section>
  );
}
