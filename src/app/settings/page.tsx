'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import {
  DEFAULT_SECTION_PREFERENCES,
  SECTION_KEYS,
  SECTION_LABELS,
  SectionKey,
  SectionPreferences,
} from '@/lib/sectionPreferences';

export default function SettingsPage() {
  const router = useRouter();
  const [prefs, setPrefs] = useState<SectionPreferences>(DEFAULT_SECTION_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/user/preferences')
      .then(async (res) => {
        if (res.status === 401) {
          router.push('/login');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.preferences) setPrefs(data.preferences);
      })
      .finally(() => setLoading(false));
  }, [router]);

  const enabledCount = useMemo(
    () => SECTION_KEYS.filter((key) => prefs[key]).length,
    [prefs]
  );

  const toggleSection = (key: SectionKey) => {
    setMessage(null);
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const resetDefaults = () => {
    setMessage(null);
    setPrefs(DEFAULT_SECTION_PREFERENCES);
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/v1/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: prefs }),
      });

      if (!res.ok) throw new Error('Failed to save settings');
      setMessage('Preferences saved');
    } catch {
      setMessage('Unable to save preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.panel}>Loading settings...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.panel}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Dashboard Settings</h1>
            <p className={styles.subtitle}>Choose which sections appear on your home dashboard.</p>
          </div>
          <button className={styles.backBtn} onClick={() => router.push('/')}>Back</button>
        </div>

        <div className={styles.count}>Enabled sections: {enabledCount}/{SECTION_KEYS.length}</div>

        <div className={styles.grid}>
          {SECTION_KEYS.map((key) => (
            <label key={key} className={styles.item}>
              <span>{SECTION_LABELS[key]}</span>
              <input
                type="checkbox"
                checked={prefs[key]}
                onChange={() => toggleSection(key)}
              />
            </label>
          ))}
        </div>

        <div className={styles.actions}>
          <button className={styles.secondaryBtn} onClick={resetDefaults}>Reset defaults</button>
          <button className={styles.primaryBtn} onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>

        {message && <div className={styles.message}>{message}</div>}
      </div>
    </div>
  );
}
