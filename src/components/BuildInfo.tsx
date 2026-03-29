'use client';

import { useState } from 'react';
import styles from './BuildInfo.module.css';
import changelog from '../lib/changelog.json';
import pkg from '../../package.json';

export default function BuildInfo() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div 
        className={styles.trigger}
        onClick={() => setIsOpen(true)}
      >
        v{pkg.version}
      </div>

      {isOpen && (
        <div className={styles.overlay} onClick={() => setIsOpen(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.header}>
              <h3 className={styles.title}>Changelog</h3>
              <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>×</button>
            </div>
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
