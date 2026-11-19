import type { PlanningScenario } from '@/server/planning/types';
import styles from './TransferOptimizer.module.css';

function points(value: number, signed = false) {
  return `${signed && value > 0 ? '+' : ''}${value.toFixed(2)} pts`;
}

export default function TransferComparison({ scenario, gameweek }: { scenario: PlanningScenario; gameweek: number }) {
  const hold = scenario.versusHold;
  if (!hold || !scenario.transfers.length) return null;
  const rows = [
    { label: `GW${gameweek}`, hold: hold.gameweekPoints, plan: scenario.projectedGameweekPoints, gain: hold.gameweekGain },
    ...(hold.horizonGameweeks > 1 ? [{
      label: `${hold.horizonGameweeks}-GW total`, hold: hold.horizonPoints,
      plan: scenario.projectedFiveGameweekPoints, gain: hold.horizonGain,
    }] : []),
  ];
  return (
    <div className={styles.comparison}>
      <table>
        <caption>Transfer vs. hold</caption>
        <thead><tr><th scope="col">Period</th><th scope="col">Hold</th><th scope="col">Make move</th><th scope="col">Net gain</th></tr></thead>
        <tbody>{rows.map(row => <tr key={row.label}>
          <th scope="row">{row.label}</th><td>{points(row.hold)}</td><td>{points(row.plan)}</td><td>{points(row.gain, true)}</td>
        </tr>)}</tbody>
      </table>
      <p>Both options pick the best projected legal XI and captain each week. Transfer hits are included. Holding uses no additional transfers.</p>
    </div>
  );
}
