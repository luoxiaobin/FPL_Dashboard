'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { buildFplSquadBookmarklet } from '@/lib/fplSquadBookmarklet';
import { buildFplAutoSyncUserscript } from '@/lib/fplAutoSyncUserscript';
import { decodeFplSquadImport, type FplSquadImport } from '@/lib/fplSquadImport';
import {
  parseFplPlayerCatalog,
  resolveFplSquadReview,
  type FplSquadReview,
  type FplSquadReviewPlayer,
} from '@/lib/fplSquadReview';
import styles from './import.module.css';

export default function FplSquadImportPage() {
  const [origin, setOrigin] = useState('');
  const [result, setResult] = useState<FplSquadImport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [review, setReview] = useState<FplSquadReview | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [pairing, setPairing] = useState<'idle' | 'creating' | 'downloaded'>('idle');
  const [pairingExpiresAt, setPairingExpiresAt] = useState<string | null>(null);

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
  const downloadAutoSync = async () => {
    if (!origin) return;
    setPairing('creating');
    setError(null);
    try {
      const response = await fetch('/api/v1/planning/sync-token', { method: 'POST' });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error ?? 'Unable to create auto-sync pairing');
      const script = buildFplAutoSyncUserscript(origin, body.token);
      const url = URL.createObjectURL(new Blob([script], { type: 'text/javascript' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'fpl-dashboard-auto-sync.user.js';
      link.click();
      URL.revokeObjectURL(url);
      setPairingExpiresAt(body.expiresAt);
      setPairing('downloaded');
    } catch (cause) {
      setPairing('idle');
      setError(cause instanceof Error ? cause.message : 'Unable to create auto-sync pairing');
    }
  };
  const confirmSquad = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const response = await fetch('/api/v1/planning/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ importedSquad: result }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error ?? 'Unable to save confirmed squad');
      setConfirmed(true);
      setExpiresAt(typeof body.expiresAt === 'string' ? body.expiresAt : null);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save confirmed squad');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>Current squad connection</p>
        <h1>Connect your current FPL squad</h1>
        <p className={styles.intro}>Install auto-sync once to keep Planning aligned whenever you use FPL’s signed-in Pick Team page. Your bookmark remains available as a manual fallback.</p>

        {result ? <div className={styles.success} role="status">
          <h2>Complete squad transport passed</h2>
          <dl>
            <div><dt>Entry</dt><dd>{result.entryId}</dd></div>
            <div><dt>Validated players</dt><dd>{result.picks.length}</dd></div>
            <div><dt>Schema</dt><dd>v{result.schemaVersion}</dd></div>
            <div><dt>Bank</dt><dd>£{(result.transfers.bank / 10).toFixed(1)}m</dd></div>
          </dl>
          <p>The fragment was cleared immediately. Review the players below before anything is saved.</p>
        </div> : <>
          <section className={styles.autoSync} aria-labelledby="auto-sync-title">
            <p className={styles.eyebrow}>Recommended</p>
            <h2 id="auto-sync-title">Automatic squad sync</h2>
            <p>Requires a Safari userscript manager such as the Userscripts extension. The generated script is private and paired only with this FPL entry.</p>
            <ol className={styles.steps}>
              <li>Install and enable your Safari userscript manager once.</li>
              <li>Download and install the private script below.</li>
              <li>Open FPL’s signed-in <strong>Pick Team</strong> page. It syncs on load, focus, and roster changes detected during the session.</li>
            </ol>
            <button className={styles.primary} type="button" onClick={() => void downloadAutoSync()} disabled={!origin || pairing === 'creating'}>
              {pairing === 'creating' ? 'Creating private pairing…' : pairing === 'downloaded' ? 'Download a replacement auto-sync script' : 'Download auto-sync userscript'}
            </button>
            {pairing === 'downloaded' && <p className={styles.pairingStatus} role="status">Private script downloaded. Install it in your userscript manager{pairingExpiresAt ? `; pairing expires ${new Date(pairingExpiresAt).toLocaleDateString()}` : ''}. Creating another script revokes the previous one.</p>}
          </section>

          <details className={styles.fallback}>
            <summary>Manual bookmark fallback</summary>
            <ol className={styles.steps}>
            <li>Click <strong>Copy complete bookmark code</strong>.</li>
            <li>In Safari, create a bookmark named <strong>Send squad to FPL Dashboard</strong>.</li>
            <li>Open <strong>Bookmarks → Edit Bookmarks</strong>, choose <strong>Edit Address</strong>, and paste the code.</li>
            <li>Visit your signed-in FPL <strong>Pick Team</strong> page and click the bookmark.</li>
            </ol>
            <button className={styles.primary} type="button" onClick={() => void copyBookmarklet()} disabled={!bookmarklet}>{copied ? 'Complete bookmark code copied' : 'Copy complete bookmark code'}</button>
            <details><summary>Show manual bookmark code</summary><textarea aria-label="Complete bookmark code" readOnly value={bookmarklet} rows={8} /></details>
          </details>
        </>}

        {result && !review && !error && <div className={styles.loading} role="status">Resolving player names from the public FPL catalogue…</div>}

        {review && <section className={styles.review} aria-labelledby="review-title">
          <div className={styles.reviewHeader}><div><p className={styles.eyebrow}>Local review</p><h2 id="review-title">Confirm this is your squad</h2></div><span>{new Date(result!.capturedAt).toLocaleString()}</span></div>
          <h3>Starting XI</h3>
          <div className={styles.playerGrid}>{review.startingEleven.map(player => <PlayerRow key={player.id} player={player} />)}</div>
          <h3>Bench</h3>
          <div className={styles.playerGrid}>{review.bench.map(player => <PlayerRow key={player.id} player={player} />)}</div>
          {confirmed ? <div className={styles.confirmed} role="status"><strong>Squad saved for Planning</strong><span>Available across your signed-in dashboard{expiresAt ? ` until ${new Date(expiresAt).toLocaleString()}` : ' until this Gameweek deadline'}.</span><Link href="/planning">Continue to Planning →</Link></div> : <button className={styles.confirm} type="button" disabled={saving} onClick={() => void confirmSquad()}>{saving ? 'Saving confirmed squad…' : 'Confirm and save squad'}</button>}
        </section>}

        {error && <p className={styles.error} role="alert">{error}</p>}
        <p className={styles.privacy}>Auto-sync and the bookmark send only the validated squad contract. They never read or copy your FPL password, cookies, or session token. The auto-sync pairing is revocable and only its SHA-256 hash is stored.</p>
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
