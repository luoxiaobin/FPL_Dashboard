'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PlanningScenario } from '@/server/planning/types';
import styles from './PlanningWorkspace.module.css';

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
  scenarios: PlanningScenario[];
  players: Record<string, PlayerSummary>;
}

const parseIds = (value: string) => value
  .split(',')
  .map(item => Number.parseInt(item.trim(), 10))
  .filter(item => Number.isInteger(item) && item > 0);

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
  const playerName = (id: number) => data?.players[String(id)]?.name ?? `#${id}`;
  const savePlan = () => {
    if (!data || !selectedScenario) return;
    localStorage.setItem(`fpl-plan-gw-${data.gameweek}`, JSON.stringify({
      selectedAt: new Date().toISOString(),
      capturedAt: data.capturedAt,
      deadline: data.deadline,
      scenario: selectedScenario,
    }));
    setSavedPlan(selectedScenario.strategy);
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
        <section className={styles.scenarioGrid} aria-label="Planning scenarios">
          {data.scenarios.map(scenario => {
            const transferSummary = scenario.transfers.length > 0
              ? scenario.transfers.map(transfer => `${playerName(transfer.outPlayerId)} → ${playerName(transfer.inPlayerId)}`).join(', ')
              : 'Hold transfer';
            return <button key={scenario.strategy} className={`${styles.scenario} ${selected === scenario.strategy ? styles.selected : ''}`} onClick={() => setSelected(scenario.strategy)}>
              <span className={styles.scenarioLabel}>{scenario.label}</span>
              <strong>{scenario.projectedFiveGameweekPoints.toFixed(1)} pts</strong>
              <span>GW{data.gameweek}: {scenario.projectedGameweekPoints.toFixed(1)}</span>
              <span>Captain: {playerName(scenario.captainId)}</span>
              <span>{transferSummary}</span>
              <span>{scenario.transferHit > 0 ? `-${scenario.transferHit} point hit` : 'No points hit'}</span>
              <small>Uncertainty {Math.round(scenario.uncertainty * 100)}%</small>
            </button>;
          })}
        </section>

        {selectedScenario && <section className={styles.detail}>
          <div className={styles.detailHeader}><div><p className={styles.eyebrow}>Selected scenario</p><h2>{selectedScenario.label}</h2></div><button className={styles.planButton} onClick={savePlan}>{savedPlan === selectedScenario.strategy ? 'Saved as My Plan' : 'Mark as My Plan'}</button></div>
          <p className={styles.tradeoff}>{selectedScenario.tradeoff}</p>
          <div className={styles.metrics}>
            <div><span>Five-GW projection</span><strong>{selectedScenario.projectedFiveGameweekPoints.toFixed(1)}</strong></div>
            <div><span>Bank remaining</span><strong>£{selectedScenario.bankRemaining.toFixed(1)}m</strong></div>
            <div><span>Captain</span><strong>{playerName(selectedScenario.captainId)}</strong></div>
            <div><span>Vice captain</span><strong>{playerName(selectedScenario.viceCaptainId)}</strong></div>
          </div>
          <h3>Starting XI</h3>
          <ol className={styles.playerList}>{selectedScenario.startingEleven.map(id => <li key={id}><span>{playerName(id)}</span><span>{data.players[String(id)]?.expectedTotal.toFixed(1)} pts</span></li>)}</ol>
          <h3>Bench order</h3>
          <ol className={styles.bench}>{selectedScenario.bench.map(id => <li key={id}>{playerName(id)}</li>)}</ol>
          <p className={styles.freshness}>Snapshot updated {new Date(data.capturedAt).toLocaleString()} · Model {selectedScenario.modelVersion}</p>
        </section>}
      </>}
    </main>
  );
}
