'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { buildFplSquadBookmarklet } from '@/lib/fplSquadBookmarklet';
import { decodeFplSquadImport, type FplSquadImport } from '@/lib/fplSquadImport';
import styles from './import.module.css';

export default function FplSquadImportPage() {
  const [origin, setOrigin] = useState('');
  const [result, setResult] = useState<FplSquadImport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const hydrateFromLocation = () => {
      setOrigin(window.location.origin);
      const encoded = new URLSearchParams(window.location.hash.slice(1)).get('data');
      if (!encoded) return;
      window.history.replaceState(null, '', window.location.pathname);
      try {
        setResult(decodeFplSquadImport(encoded));
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'The squad import was invalid.');
      }
    };
    const timeout = window.setTimeout(hydrateFromLocation, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  const bookmarklet = useMemo(() => origin ? buildFplSquadBookmarklet(origin) : '', [origin]);
  const copyBookmarklet = async () => {
    try {
      await navigator.clipboard.writeText(bookmarklet);
      setCopied(true);
      setError(null);
    } catch {
      setError('Copy was blocked. Expand the manual code and copy it directly.');
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>Phase 2 · authenticated squad transport</p>
        <h1>Connect your current FPL squad</h1>
        <p className={styles.intro}>Install this private Safari bookmark once, then run it from FPL’s signed-in Pick Team page whenever you want a fresh pre-deadline squad.</p>

        {result ? <div className={styles.success} role="status">
          <h2>Complete squad transport passed</h2>
          <dl>
            <div><dt>Entry</dt><dd>{result.entryId}</dd></div>
            <div><dt>Validated players</dt><dd>{result.picks.length}</dd></div>
            <div><dt>Schema</dt><dd>v{result.schemaVersion}</dd></div>
            <div><dt>Bank</dt><dd>£{(result.transfers.bank / 10).toFixed(1)}m</dd></div>
          </dl>
          <p>The fragment was cleared immediately. Nothing was saved; player review and confirmation arrive in Phase 3.</p>
        </div> : <>
          <ol className={styles.steps}>
            <li>Click <strong>Copy complete bookmark code</strong>.</li>
            <li>In Safari, create a bookmark named <strong>Send squad to FPL Dashboard</strong>.</li>
            <li>Open <strong>Bookmarks → Edit Bookmarks</strong>, choose <strong>Edit Address</strong>, and paste the code.</li>
            <li>Visit your signed-in FPL <strong>Pick Team</strong> page and click the bookmark.</li>
          </ol>
          <button className={styles.primary} type="button" onClick={() => void copyBookmarklet()} disabled={!bookmarklet}>{copied ? 'Complete bookmark code copied' : 'Copy complete bookmark code'}</button>
          <details><summary>Show manual bookmark code</summary><textarea aria-label="Complete bookmark code" readOnly value={bookmarklet} rows={8} /></details>
        </>}

        {error && <p className={styles.error} role="alert">{error}</p>}
        <p className={styles.privacy}>The bookmark sends only the validated squad contract. It never reads or copies your FPL password, cookies, or session token.</p>
        <Link className={styles.back} href="/planning">← Return to Planning</Link>
      </section>
    </main>
  );
}
