import type { ChipAdvice } from '@/server/planning/types';
import styles from './PlanningWorkspace.module.css';

const names: Record<string, string> = {
  bboost: 'Bench Boost', '3xc': 'Triple Captain', freehit: 'Free Hit', wildcard: 'Wildcard',
};

export default function ChipOpportunities({ advice, gameweek, confirmedSquad }: {
  advice?: ChipAdvice;
  gameweek: number;
  confirmedSquad: boolean;
}) {
  return (
    <section className={`${styles.detail} ${styles.teamNews}`} aria-labelledby="chip-opportunities-title">
      <h2 id="chip-opportunities-title">Chip opportunities</h2>
      {!advice ? <p>Chip usage could not be verified from FPL history.</p> : <>
        <p className={styles.tradeoff}>
          Current chip copies expire at the GW{advice.expiresGameweek} deadline
          {advice.deadline && <> · <time dateTime={advice.deadline}>{new Date(advice.deadline).toLocaleString()}</time></>}.
          {' '}Compared GW{gameweek}–GW{advice.throughGameweek} using the Balanced squad and its proposed moves.
        </p>
        {advice.activeChip
          ? <p>{names[advice.activeChip] ?? advice.activeChip} is already active for GW{gameweek}.</p>
          : !confirmedSquad && <p>Based on public chip history. Check your active chip on FPL before using another.</p>}
        <ul className={styles.newsItems}>
          {advice.options.map(option => {
            const decision = option.used ? 'Already used this half'
              : advice.activeChip ? 'Another chip cannot be played this week'
              : advice.recommendation === option.chip ? 'Consider using this week'
              : option.later && option.later.points > 0 ? `Hold for GW${option.later.gameweek}` : 'No clear advantage';
            return <li key={option.chip}>
              <strong>{names[option.chip]} · {decision}</strong>
              {!option.used && <>
                <p>GW{gameweek} estimate · +{option.currentPoints.toFixed(1)} pts
                  {option.later && <> · Best later week in forecast: GW{option.later.gameweek} (+{option.later.points.toFixed(1)} pts)</>}
                </p>
                <p>{option.chip === 'bboost'
                  ? 'Bench points before allowing for normal auto-subs. The true gain can be lower.'
                  : 'Extra points above normal captaincy, including an estimated vice-captain fallback.'}</p>
              </>}
            </li>;
          })}
        </ul>
      </>}
    </section>
  );
}
