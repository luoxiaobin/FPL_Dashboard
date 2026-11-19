import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { FplImportedPick } from '@/lib/fplSquadImport';
import type { PlanningScenario } from '@/server/planning/types';
import styles from './PlanningWorkspace.module.css';

export interface ReviewablePlan {
  id: string;
  scenarioId: string;
  strategy: string;
  gameweek: number;
  selectedAt: string;
  frozenAt: string | null;
  decisions: Pick<PlanningScenario, 'transfers' | 'transferHit' | 'bankRemaining' |
    'squad' | 'startingEleven' | 'bench' | 'captainId' | 'viceCaptainId' | 'chip'> & { deadline: string };
  playerNames: Record<string, string>;
}

type SquadCheck = {
  capturedAt: string;
  picks: Array<Pick<FplImportedPick, 'elementId' | 'lineupPosition' | 'isCaptain' | 'isViceCaptain'>>;
};

function samePlayers(actual: number[], planned: number[]) {
  return actual.length === planned.length && planned.every(id => actual.includes(id));
}

export default function ReviewOnFpl({ plan }: { plan: ReviewablePlan }) {
  const { decisions } = plan;
  const deadline = Date.parse(decisions.deadline);
  const [deadlinePassed, setDeadlinePassed] = useState(() => Date.now() >= deadline);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'manual'>('idle');

  useEffect(() => {
    if (!Number.isFinite(deadline) || deadlinePassed) return;
    let timer: number;
    const checkDeadline = () => {
      const remaining = deadline - Date.now();
      if (remaining <= 0) setDeadlinePassed(true);
      else timer = window.setTimeout(checkDeadline, Math.min(remaining, 2_147_483_647));
    };
    checkDeadline();
    return () => window.clearTimeout(timer);
  }, [deadline, deadlinePassed]);

  const deadlineKnown = Number.isFinite(deadline);
  const closed = Boolean(plan.frozenAt) || deadlinePassed;
  const canOpenFpl = deadlineKnown && !closed;
  const [squad, setSquad] = useState<SquadCheck | null>(null);
  const [checkStatus, setCheckStatus] = useState<'checking' | 'ready' | 'error'>('checking');
  const checkRequest = useRef<AbortController | null>(null);
  const checkSquad = useCallback(async () => {
    checkRequest.current?.abort();
    const request = new AbortController();
    checkRequest.current = request;
    setCheckStatus('checking');
    try {
      const response = await fetch('/api/v1/planning/import', { signal: request.signal, cache: 'no-store' });
      if (!response.ok) throw new Error('Unable to check the confirmed squad');
      const latest = await response.json();
      if (request.signal.aborted) return;
      setSquad(latest.capturedAt && Array.isArray(latest.picks) ? latest : null);
      setCheckStatus('ready');
    } catch {
      if (!request.signal.aborted) setCheckStatus('error');
    }
  }, []);
  useEffect(() => {
    if (!canOpenFpl) return;
    const onFocus = () => void checkSquad();
    onFocus();
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      checkRequest.current?.abort();
    };
  }, [canOpenFpl, checkSquad]);

  const freshSquad = checkStatus === 'ready' && squad &&
    Date.parse(squad.capturedAt) >= Date.parse(plan.selectedAt) ? squad : null;
  const squadIds = freshSquad?.picks.map(pick => pick.elementId) ?? [];
  const startingIds = freshSquad?.picks.filter(pick => pick.lineupPosition <= 11).map(pick => pick.elementId) ?? [];
  const benchIds = freshSquad?.picks.filter(pick => pick.lineupPosition > 11)
    .sort((a, b) => a.lineupPosition - b.lineupPosition).map(pick => pick.elementId) ?? [];
  // The planner puts its reserve goalkeeper last. FPL's goalkeeper slot is separate from outfield priority.
  const reserveKeeper = decisions.bench.at(-1);
  const outfieldBench = benchIds.filter(id => id !== reserveKeeper);
  const checks = [
    ['Squad', samePlayers(squadIds, decisions.squad)],
    ['Starting XI', samePlayers(startingIds, decisions.startingEleven)],
    ['Captain', freshSquad?.picks.find(pick => pick.isCaptain)?.elementId === decisions.captainId],
    ['Vice captain', freshSquad?.picks.find(pick => pick.isViceCaptain)?.elementId === decisions.viceCaptainId],
    ['Bench order', samePlayers(benchIds, decisions.bench) &&
      decisions.bench.slice(0, -1).every((id, index) => id === outfieldBench[index])],
  ] as const;
  const deadlineLabel = deadlineKnown ? new Date(deadline).toLocaleString() : 'Deadline unavailable';
  const scenarioLabel = plan.strategy.charAt(0).toUpperCase() + plan.strategy.slice(1);
  const name = (id: number) => plan.playerNames[String(id)] ?? `Player #${id}`;
  const transfers = decisions.transfers.map(transfer =>
    `${name(transfer.outPlayerId)} → ${name(transfer.inPlayerId)}`);
  const hit = decisions.transferHit > 0 ? `Expected hit: −${decisions.transferHit} pts` : 'No points hit expected';
  const bank = `Estimated bank remaining: £${decisions.bankRemaining.toFixed(1)}m`;
  const captain = `Captain: ${name(decisions.captainId)}`;
  const viceCaptain = `Vice captain: ${name(decisions.viceCaptainId)}`;
  const chip = decisions.chip ? `Chip: ${decisions.chip}` : null;
  const checklist = [
    `GW${plan.gameweek} · ${scenarioLabel}`,
    closed ? `Gameweek closed · ${deadlineLabel}` : `Deadline: ${deadlineLabel}`,
    '', 'Transfers', ...(transfers.length ? transfers : ['No transfers planned']), hit, bank,
    '', 'Starting XI', ...decisions.startingEleven.map(name), captain, viceCaptain,
    '', 'Bench order', ...decisions.bench.map((id, index) => `${index + 1}. ${name(id)}`),
    ...(chip ? [chip] : []),
  ].join('\n');

  const copyChecklist = async () => {
    try {
      await navigator.clipboard.writeText(checklist);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('manual');
    }
  };

  return (
    <details className={styles.review}>
      <summary>Review on FPL</summary>
      <div className={styles.reviewContent}>
        <h2>GW{plan.gameweek} · {scenarioLabel}</h2>
        <p>{closed ? 'Gameweek closed' : 'Deadline'} · {deadlineLabel}</p>
        {canOpenFpl && <p>Make and confirm these changes on the official FPL site.</p>}
        {canOpenFpl && <section className={styles.verification} aria-label="FPL verification">
          <h3>Check your FPL changes</h3>
          <p role="status">
            {checkStatus === 'checking' ? 'Checking latest squad…'
              : checkStatus === 'error' ? 'Could not check the latest squad. Try again.'
              : freshSquad ? `Compared with squad synced ${new Date(freshSquad.capturedAt).toLocaleString()}.`
              : 'Refresh your squad from FPL Pick Team to verify changes made after saving this plan.'}
          </p>
          {freshSquad && <ul className={styles.verificationResults}>
            {decisions.transfers.map(({ outPlayerId, inPlayerId }, index) => (
              <li key={index}>{transfers[index]} · {squadIds.includes(inPlayerId) && !squadIds.includes(outPlayerId)
                ? 'Squad reflects transfer' : 'Pending'}</li>
            ))}
            {checks.map(([label, matches]) => <li key={label}>{label} · {matches ? 'Matches plan' : 'Pending'}</li>)}
          </ul>}
          <div className={styles.verificationActions}>
            <button className={styles.reviewCopy} type="button" disabled={checkStatus === 'checking'} onClick={() => void checkSquad()}>Check latest sync</button>
            <Link className={styles.reviewCopy} href="/planning/import">Refresh squad</Link>
          </div>
        </section>}
        <div className={styles.reviewSteps}>
          <section aria-label="Transfers">
            <h3>Transfers</h3>
            {transfers.length > 0
              ? <ul>{transfers.map((transfer, index) => <li key={index}>{transfer}</li>)}</ul>
              : <p>No transfers planned</p>}
            <p><span>{hit}</span><br />{bank}</p>
            {canOpenFpl && transfers.length > 0 && <>
              <p>Check the price and points hit shown by FPL before confirming.</p>
              <a href="https://fantasy.premierleague.com/transfers" target="_blank" rel="noopener noreferrer">Open Transfers</a>
            </>}
          </section>
          <section aria-label="Lineup">
            <h3>Starting XI</h3>
            <ul className={styles.reviewLineup}>{decisions.startingEleven.map(id => <li key={id}>{name(id)}</li>)}</ul>
            <p><span>{captain}</span><br />{viceCaptain}</p>
            <h3>Bench order</h3>
            <ol>{decisions.bench.map(id => <li key={id}>{name(id)}</li>)}</ol>
            {chip && <p>{chip}</p>}
            {canOpenFpl && <a href="https://fantasy.premierleague.com/my-team" target="_blank" rel="noopener noreferrer">Open Pick Team</a>}
          </section>
        </div>
        <button className={styles.reviewCopy} type="button" onClick={() => void copyChecklist()}>Copy checklist</button>
        <div role="status">
          {copyStatus === 'copied' && 'Checklist copied.'}
          {copyStatus === 'manual' && 'Select and copy the checklist below.'}
        </div>
        {copyStatus === 'manual' && <textarea aria-label="Plan checklist" readOnly value={checklist} onFocus={event => event.currentTarget.select()} />}
      </div>
    </details>
  );
}
