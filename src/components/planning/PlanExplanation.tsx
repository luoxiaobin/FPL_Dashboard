import { useState } from 'react';
import { PLAN_EXPLANATION_MODEL } from '@/lib/planExplanationModel';
import styles from './PlanningWorkspace.module.css';

export default function PlanExplanation({ scenarioId }: { scenarioId: string }) {
  const [explanation, setExplanation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function explain() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/v1/planning/explanation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setExplanation(body.explanation);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not explain this plan.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.planExplanation}>
      <div className={styles.explanationHeader}>
        {explanation ? <h3>Plan explanation</h3> : (
          <button className={styles.reviewCopy} type="button" disabled={loading}
            aria-describedby="plan-explanation-model" onClick={() => void explain()}>
            {loading ? 'Explaining…' : 'Explain this plan'}
          </button>
        )}
        <span id="plan-explanation-model" className={styles.modelAttribution}>
          Powered by {PLAN_EXPLANATION_MODEL.name}
        </span>
      </div>
      <div role="status">
        {explanation && <p>{explanation}</p>}
        {error && <p>{error}</p>}
      </div>
    </div>
  );
}
