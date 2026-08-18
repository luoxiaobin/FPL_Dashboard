import { test as base, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

interface NetworkFailure {
  method: string;
  status?: number;
  url: string;
  error?: string;
}

interface CapturedEvidence {
  consoleErrors: string[];
  networkFailures: NetworkFailure[];
}

export const test = base.extend<{ failureEvidence: CapturedEvidence }>({
  failureEvidence: [async ({ page }, use, testInfo) => {
    const evidence: CapturedEvidence = { consoleErrors: [], networkFailures: [] };

    page.on('console', message => {
      if (message.type() === 'error') evidence.consoleErrors.push(message.text());
    });
    page.on('requestfailed', request => {
      evidence.networkFailures.push({
        method: request.method(),
        url: request.url(),
        error: request.failure()?.errorText,
      });
    });
    page.on('response', response => {
      if (response.status() >= 400) {
        evidence.networkFailures.push({
          method: response.request().method(),
          status: response.status(),
          url: response.url(),
        });
      }
    });

    await use(evidence);

    const evidencePath = testInfo.outputPath('runtime-evidence.json');
    await writeFile(evidencePath, JSON.stringify({
        test: testInfo.titlePath.join(' > '),
        project: testInfo.project.name,
        url: page.url(),
        consoleErrors: evidence.consoleErrors,
        networkFailures: evidence.networkFailures,
      }, null, 2));
    await testInfo.attach('runtime-evidence.json', {
      path: evidencePath,
      contentType: 'application/json',
    });
  }, { auto: true }],
});

export { expect };
