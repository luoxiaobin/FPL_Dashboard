'use client';

import { useState } from 'react';
import styles from './BuildInfo.module.css';
import changelog from '../lib/changelog.json';
import type { ReleaseIdentity } from '../lib/release';

export default function BuildInfo({ release }: { release: ReleaseIdentity }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setIsOpen(true)}
        aria-label={`Release v${release.version}, commit ${release.shortCommitSha}`}
      >
        v{release.version} · {release.shortCommitSha}
      </button>

      {isOpen && (
        <div className={styles.overlay} onClick={() => setIsOpen(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.header}>
              <h3 className={styles.title}>Release details</h3>
              <button type="button" aria-label="Close release details" className={styles.closeBtn} onClick={() => setIsOpen(false)}>×</button>
            </div>
            <dl className={styles.releaseGrid}>
              <div><dt>Release</dt><dd>v{release.version}</dd></div>
              <div><dt>Environment</dt><dd>{release.environment}</dd></div>
              <div><dt>Commit</dt><dd title={release.commitSha ?? undefined}>{release.shortCommitSha}</dd></div>
              <div><dt>Branch</dt><dd>{release.branch ?? 'local'}</dd></div>
              {release.deploymentId && <div className={styles.deployment}><dt>Deployment</dt><dd>{release.deploymentId}</dd></div>}
            </dl>
            <h4 className={styles.changelogTitle}>Changelog</h4>
            <div className={styles.scrollArea}>
              {changelog.map((entry) => (
                <div key={entry.version} className={styles.entry}>
                  <div className={styles.entryHeader}>
                    <span className={styles.versionTag}>v{entry.version}</span>
                    <span className={styles.date}>{entry.date}</span>
                  </div>
                  <h4 className={styles.entryTitle}>{entry.title}</h4>
                  <ul className={styles.list}>
                    {entry.changes.map((item, idx) => (
                      <li key={idx} className={styles.item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
