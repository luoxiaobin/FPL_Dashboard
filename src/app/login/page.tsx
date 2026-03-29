'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function LoginPage() {
  const [teamId, setTeamId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Ensure it's purely numeric
    if (!/^\d+$/.test(teamId)) {
      setError('Team ID must be a numeric integer value (e.g. 123456).');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId }),
      });

      if (!res.ok) {
        throw new Error('Could not find FPL Team data or network error');
      }

      const data = await res.json();
      if (data.success) {
        router.push('/');
      } else {
        throw new Error(data.error || 'Team ID Verification Failed');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while finding your team.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        <h1 className={styles.title}>FPL Public Dashboard</h1>
        
        {error && <div className={styles.error}>{error}</div>}

        <form className={styles.form} onSubmit={handleLogin}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="teamId">FPL Numeric Team ID</label>
            <input
              id="teamId"
              type="text"
              className={styles.input}
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              placeholder="e.g. 1234567"
              required
            />
          </div>

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isLoading || !teamId}
          >
            {isLoading ? 'Searching...' : 'Load Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}
