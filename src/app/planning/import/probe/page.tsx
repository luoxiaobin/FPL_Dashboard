'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  buildFplProbeBookmarklet,
  decodeFplImportProbe,
  type FplImportProbe,
} from '@/lib/fplImportProbe';
import styles from './probe.module.css';

export default function FplImportProbePage() {
  const [origin, setOrigin] = useState('');
  const [result, setResult] = useState<FplImportProbe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const hydrateFromLocation = () => {
      setOrigin(window.location.origin);
      const encoded = new URLSearchParams(window.location.hash.slice(1)).get('data');
      if (!encoded) return;
      window.history.replaceState(null, '', window.location.pathname);
      try {
        setResult(decodeFplImportProbe(encoded));
      } catch {
        setError('The probe returned malformed data. Nothing was saved.');
      }
    };

    const timeout = window.setTimeout(hydrateFromLocation, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  const bookmarklet = useMemo(
    () => origin ? buildFplProbeBookmarklet(origin) : '',
    [origin],
  );

  const copyBookmarklet = async () => {
    try {
      await navigator.clipboard.writeText(bookmarklet);
      setCopied(true);
    } catch {
      setError('Copy was blocked. Select the code below and copy it manually.');
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>Phase 0 · read-only feasibility test</p>
        <h1>Test current-team access</h1>
        <p className={styles.intro}>
          This diagnostic checks whether your signed-in FPL browser can send a minimal team summary to this dashboard. It does not send player identities, credentials, cookies or session tokens, and it saves nothing.
        </p>

        {result ? (
          <div className={styles.success} role="status">
            <h2>Authenticated import is feasible</h2>
            <dl>
              <div><dt>Entry</dt><dd>{result.entryId}</dd></div>
              <div><dt>Squad slots</dt><dd>{result.pickCount}</dd></div>
              <div><dt>Captain</dt><dd>{result.captainCount === 1 ? 'Present' : `Count: ${result.captainCount}`}</dd></div>
              <div><dt>Vice captain</dt><dd>{result.viceCaptainCount === 1 ? 'Present' : `Count: ${result.viceCaptainCount}`}</dd></div>
              <div><dt>Bank field</dt><dd>{result.hasBank ? 'Present' : 'Missing'}</dd></div>
            </dl>
            <p>No squad data was persisted. Return here and tell Codex that Phase 0 passed.</p>
          </div>
        ) : (
          <ol className={styles.steps}>
            <li>Click <strong>Copy Safari bookmark code</strong>.</li>
            <li>In Safari, add any page as a bookmark named <strong>Send squad to FPL Dashboard</strong>.</li>
            <li>Edit that bookmark and replace its address with the copied code.</li>
            <li>Open FPL’s signed-in <strong>Pick Team</strong> page and click the bookmark.</li>
            <li>A new tab should return here with the diagnostic result.</li>
          </ol>
        )}

        {!result && <>
          <button className={styles.primary} type="button" onClick={() => void copyBookmarklet()} disabled={!bookmarklet}>
            {copied ? 'Bookmark code copied' : 'Copy Safari bookmark code'}
          </button>
          <details>
            <summary>Show bookmark code</summary>
            <textarea aria-label="Bookmark code" readOnly value={bookmarklet} rows={8} />
          </details>
        </>}

        {error && <p className={styles.error} role="alert">{error}</p>}
      </section>
    </main>
  );
}
