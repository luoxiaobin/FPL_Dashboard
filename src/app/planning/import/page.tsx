'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { buildFplSquadBookmarklet } from '@/lib/fplSquadBookmarklet';
import { decodeFplSquadImport, type FplSquadImport } from '@/lib/fplSquadImport';
import {
  parseFplPlayerCatalog,
  resolveFplSquadReview,
  type FplSquadReview,
  type FplSquadReviewPlayer,
} from '@/lib/fplSquadReview';
import styles from './import.module.css';
import { saveConfirmedFplSquad } from '@/lib/fplSquadSession';

export default function FplSquadImportPage() {
  const [origin, setOrigin] = useState('');
  const [result, setResult] = useState<FplSquadImport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [review, setReview] = useState<FplSquadReview | null>(null);
  const [confirmed, setConfirmed] = useState(false);

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

  useEffect(() => {
    if (!result) return;
    let cancelled = false;
    const loadCatalog = async () => {
      try {
        const response = await fetch('/api/v1/planning/player-catalog');
        if (!response.ok) throw new Error('Unable to load the current FPL player catalogue');
        const body = await response.json();
        const resolved = resolveFplSquadReview(result, parseFplPlayerCatalog(body?.players));
        if (!cancelled) setReview(resolved);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Unable to resolve player details');
      }
    };
    void loadCatalog();
    return () => { cancelled = true; };
  }, [result]);

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
  const confirmSquad = () => {
    if (!result) return;
    try {
      saveConfirmedFplSquad(result);
      setConfirmed(true);
      setError(null);
    } catch {
      setError('Safari could not retain the confirmed squad for this tab.');
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>Phase 3 · local squad review</p>
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
          <p>The fragment was cleared immediately. Your squad remains local to this tab and has not been saved.</p>
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

        {result && !review && !error && <div className={styles.loading} role="status">Resolving player names from the public FPL catalogue…</div>}

        {review && <section className={styles.review} aria-labelledby="review-title">
          <div className={styles.reviewHeader}><div><p className={styles.eyebrow}>Local review</p><h2 id="review-title">Confirm this is your squad</h2></div><span>{new Date(result!.capturedAt).toLocaleString()}</span></div>
          <h3>Starting XI</h3>
          <div className={styles.playerGrid}>{review.startingEleven.map(player => <PlayerRow key={player.id} player={player} />)}</div>
          <h3>Bench</h3>
          <div className={styles.playerGrid}>{review.bench.map(player => <PlayerRow key={player.id} player={player} />)}</div>
          {confirmed ? <div className={styles.confirmed} role="status"><strong>Squad confirmed for this tab</strong><span>It is ready for scenario planning and has not been written to the database.</span><Link href="/planning">Continue to Planning →</Link></div> : <button className={styles.confirm} type="button" onClick={confirmSquad}>Confirm this squad</button>}
        </section>}

        {error && <p className={styles.error} role="alert">{error}</p>}
        <p className={styles.privacy}>The bookmark sends only the validated squad contract. It never reads or copies your FPL password, cookies, or session token.</p>
        <Link className={styles.back} href="/planning">← Return to Planning</Link>
      </section>
    </main>
  );
}

function PlayerRow({ player }: { player: FplSquadReviewPlayer }) {
  return <div className={styles.player}>
    <span className={styles.position}>{player.position}</span>
    <span><strong>{player.name}</strong><small>{player.teamName}</small></span>
    <span className={styles.badges}>{player.isCaptain && <b>C</b>}{player.isViceCaptain && <b>V</b>}</span>
    <span>£{(player.sellingPrice / 10).toFixed(1)}m</span>
  </div>;
}
