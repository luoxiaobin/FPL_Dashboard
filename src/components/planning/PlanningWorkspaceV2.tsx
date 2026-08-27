'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { PlanningScenario } from '@/server/planning/types';
import styles from './PlanningWorkspace.module.css';
import { clearConfirmedFplSquad } from '@/lib/fplSquadSession';

interface PlayerSummary {
  id: number;
  name: string;
  position: number;
  teamId: number;
  price: number;
  expectedTotal: number;
  floor: number;
  ceiling: number;
  uncertainty: number;
}

interface WorkspacePayload {
  gameweek: number;
  deadline: string;
  capturedAt: string;
  freshUntil: string;
  squadSource: 'authenticated-import' | 'public-gameweek';
  squadGameweek: number | null;
  sourceCapturedAt: string;
  transferState: { freeTransfers: number | null; unlimited: boolean };
  scenarios: PlanningScenario[];
  players: Record<string, PlayerSummary>;
  reproducibility: 'persisted' | 'degraded';
}

interface MyPlanSummary {
  strategy: string;
  selectedAt: string;
  frozenAt: string | null;
  outcome: { projectedPoints?: number; actualPoints?: number; projectionError?: number } | null;
}

const parseIds = (value: string) => value
  .split(',')
  .map(item => Number.parseInt(item.trim(), 10))
  .filter(item => Number.isInteger(item) && item > 0);
const formatNumber = (value: unknown, digits = 1) => (
  value !== null && value !== undefined && Number.isFinite(Number(value))
    ? Number(value).toFixed(digits)
    : '—'
);

export default function PlanningWorkspace() {
  const router = useRouter();
  const [data, setData] = useState<WorkspacePayload | null>(null);
  const [selected, setSelected] = useState('balanced');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState('');
  const [excluded, setExcluded] = useState('');
  const [maxHit, setMaxHit] = useState(0);
  const [bankReserve, setBankReserve] = useState(0);
  const [savedPlan, setSavedPlan] = useState<string | null>(null);
  const [myPlan, setMyPlan] = useState<MyPlanSummary | null>(null);
  const [usingConfirmedSquad, setUsingConfirmedSquad] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/v1/planning/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ constraints: {
          lockedPlayerIds: parseIds(locked),
          excludedPlayerIds: parseIds(excluded),
          maxPointsHit: maxHit,
          bankReserve,
        } }),
      });
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to generate scenarios');
      setData(payload);
      setUsingConfirmedSquad(payload.squadSource === 'authenticated-import');
      setSavedPlan(null);
      setMyPlan(null);
      if (payload.reproducibility === 'persisted') {
        const planResponse = await fetch(`/api/v1/planning/plans?gameweek=${payload.gameweek}`);
        if (planResponse.ok) {
          const planPayload = await planResponse.json();
          setSavedPlan(planPayload.plan?.strategy ?? null);
          setMyPlan(planPayload.plan ?? null);
        }
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to generate scenarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedScenario = useMemo(
    () => data?.scenarios.find(scenario => scenario.strategy === selected) ?? data?.scenarios[0],
    [data, selected],
  );
  const allPlansConverge = useMemo(() => {
    if (!data || data.scenarios.length < 2) return false;
    const signature = (scenario: PlanningScenario) => JSON.stringify({
      transfers: scenario.transfers.map(transfer => [transfer.outPlayerId, transfer.inPlayerId]),
      captainId: scenario.captainId,
      startingEleven: [...scenario.startingEleven].sort((a, b) => a - b),
    });
    return data.scenarios.every(scenario => signature(scenario) === signature(data.scenarios[0]));
  }, [data]);
  const projectionLabel = (strategy: PlanningScenario['strategy']) => ({
    floor: 'floor', balanced: 'expected', upside: 'ceiling',
  }[strategy]);
  const playerName = (id: number) => data?.players[String(id)]?.name ?? `#${id}`;
  const savePlan = async () => {
    if (!data || !selectedScenario?.scenarioId) return;
    setError(null);
    try {
      const response = await fetch('/api/v1/planning/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId: selectedScenario.scenarioId }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to save My Plan');
      setSavedPlan(selectedScenario.strategy);
      setMyPlan(payload.plan);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save My Plan');
    }
  };
  const clearSquad = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/v1/planning/import', { method: 'DELETE' });
      if (!response.ok) throw new Error('Unable to clear the saved squad');
      clearConfirmedFplSquad();
      setUsingConfirmedSquad(false);
      setData(null);
      setError('Saved squad cleared. Import your current picks again to plan before the deadline.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to clear the saved squad');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>FPL planning workspace</p>
          <h1>This Week</h1>
          <p className={styles.subtitle}>Compare complete five-Gameweek plans. No scenario is the default answer.</p>
        </div>
        {data && <div className={styles.deadline}>GW{data.gameweek} deadline<br /><strong>{new Date(data.deadline).toLocaleString()}</strong></div>}
      </header>

      <section className={styles.importCard} aria-labelledby="current-squad-title">
        <div><p className={styles.eyebrow}>Pre-deadline squad access</p><h2 id="current-squad-title">{usingConfirmedSquad ? 'Confirmed squad connected' : 'Using latest public squad'}</h2><p>{usingConfirmedSquad ? `Planning is using your reviewed squad for GW${data?.gameweek}.${data?.transferState?.unlimited ? ' Unlimited changes are modeled with no points hit.' : ''}` : `Planning is using your published GW${data?.squadGameweek ?? data?.gameweek} squad as the baseline for GW${data?.gameweek}. Import again after making private FPL changes.`}</p></div>
        <div className={styles.importActions}><Link href="/planning/import">{usingConfirmedSquad ? 'Refresh squad' : 'Set up squad import'}</Link>{usingConfirmedSquad && <button type="button" onClick={() => void clearSquad()}>Clear saved squad</button>}</div>
      </section>

      <section className={styles.constraints} aria-labelledby="constraints-title">
        <div><h2 id="constraints-title">Your constraints</h2><p>Use FPL player IDs, separated by commas.</p></div>
        <label>Lock players<input value={locked} onChange={event => setLocked(event.target.value)} placeholder="e.g. 351, 427" /></label>
        <label>Exclude targets<input value={excluded} onChange={event => setExcluded(event.target.value)} placeholder="e.g. 92" /></label>
        <label>Maximum hit<select value={maxHit} onChange={event => setMaxHit(Number(event.target.value))}><option value={0}>0 pts</option><option value={4}>4 pts</option><option value={8}>8 pts</option></select></label>
        <label>Bank reserve<input type="number" min="0" max="20" step="0.1" value={bankReserve} onChange={event => setBankReserve(Number(event.target.value))} /></label>
        <button onClick={() => void load()} disabled={loading}>{loading ? 'Generating…' : 'Regenerate plans'}</button>
      </section>

      {error && <section className={styles.state}><h2>Planning unavailable</h2><p>{error}</p></section>}
      {loading && !data && <section className={styles.state}><h2>Building your scenarios…</h2><p>Checking squad legality, projections and constraints.</p></section>}

      {data && <>
        {allPlansConverge && <aside className={styles.convergence}><strong>Robust recommendation</strong><span>All three risk profiles converge on the same move, lineup and captain under current data. The point ranges below show its floor, expected outcome and ceiling—not three artificially different answers.</span></aside>}
        <section className={styles.scenarioGrid} aria-label="Planning scenarios">
          {data.scenarios.map(scenario => {
            const transferSummary = scenario.transfers.length > 0
              ? scenario.transfers.map(transfer => `${playerName(transfer.outPlayerId)} → ${playerName(transfer.inPlayerId)}`).join(', ')
              : 'Hold transfer';
            return <button key={scenario.strategy} className={`${styles.scenario} ${selected === scenario.strategy ? styles.selected : ''}`} onClick={() => setSelected(scenario.strategy)}>
              <span className={styles.scenarioLabel}>{scenario.label}</span>
              <strong>{formatNumber(scenario.projectedFiveGameweekPoints)} pts</strong>
              <span>Five-GW {projectionLabel(scenario.strategy)}</span>
              <span>GW{data.gameweek}: {formatNumber(scenario.projectedGameweekPoints)}</span>
              <span>Captain: {playerName(scenario.captainId)}</span>
              <span>{transferSummary}</span>
              <span>{scenario.transferHit > 0 ? `-${scenario.transferHit} point hit` : 'No points hit'}</span>
              <small>Uncertainty {Math.round(scenario.uncertainty * 100)}%</small>
            </button>;
          })}
        </section>

        {selectedScenario && <section className={styles.detail}>
          <div className={styles.detailHeader}><div><p className={styles.eyebrow}>Selected scenario</p><h2>{selectedScenario.label}</h2></div><button className={styles.planButton} onClick={() => void savePlan()} disabled={!selectedScenario.scenarioId}>{savedPlan === selectedScenario.strategy ? 'Saved as My Plan' : selectedScenario.scenarioId ? 'Mark as My Plan' : 'Plan storage unavailable'}</button></div>
          <p className={styles.tradeoff}>{selectedScenario.tradeoff}</p>
          <div className={styles.metrics}>
            <div><span>Five-GW {projectionLabel(selectedScenario.strategy)}</span><strong>{formatNumber(selectedScenario.projectedFiveGameweekPoints)}</strong></div>
            <div><span>Bank remaining</span><strong>£{formatNumber(selectedScenario.bankRemaining)}m</strong></div>
            <div><span>Captain</span><strong>{playerName(selectedScenario.captainId)}</strong></div>
            <div><span>Vice captain</span><strong>{playerName(selectedScenario.viceCaptainId)}</strong></div>
          </div>
          <h3>Starting XI</h3>
          <ol className={styles.playerList}>{selectedScenario.startingEleven.map(id => <li key={id}><span>{playerName(id)}</span><span>{formatNumber(data.players[String(id)]?.expectedTotal)} pts</span></li>)}</ol>
          <h3>Bench order</h3>
          <ol className={styles.bench}>{selectedScenario.bench.map(id => <li key={id}>{playerName(id)}</li>)}</ol>
          <p className={styles.freshness}>Snapshot updated {new Date(data.capturedAt).toLocaleString()} · Model {selectedScenario.modelVersion}</p>
          {myPlan && <p className={styles.freshness}>{myPlan.outcome
              ? `My Plan evaluated: ${formatNumber(myPlan.outcome.actualPoints, 0)} actual vs ${formatNumber(myPlan.outcome.projectedPoints)} projected (${Number(myPlan.outcome.projectionError ?? 0) >= 0 ? '+' : ''}${formatNumber(myPlan.outcome.projectionError)}).`
            : myPlan.frozenAt
              ? `My Plan frozen at the deadline; awaiting finalized FPL results.`
              : `My Plan saved ${new Date(myPlan.selectedAt).toLocaleString()} and will freeze at the deadline.`}</p>}
        </section>}
      </>}
    </main>
  );
}
