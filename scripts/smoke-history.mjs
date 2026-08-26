import { readFile, writeFile } from 'node:fs/promises';

const DEFAULT_WINDOW = 3;
const DEFAULT_THRESHOLD = 2;
const MAX_HISTORY = 24;

export function evaluateHealthHistory(previous, current, options = {}) {
  const windowSize = options.windowSize ?? DEFAULT_WINDOW;
  const threshold = options.threshold ?? DEFAULT_THRESHOLD;
  const history = [...previous, current].slice(-MAX_HISTORY);
  const recent = history.slice(-windowSize);
  const degradedCount = recent.filter(result => result.status === 'degraded').length;
  const outage = current.status === 'outage';

  return {
    history,
    recent,
    degradedCount,
    escalate: outage || (recent.length >= windowSize && degradedCount >= threshold),
    reason: outage
      ? `Current production check is an outage: ${current.error ?? 'unknown failure'}`
      : `${degradedCount} of the last ${recent.length} production checks recovered after an initial failure`,
  };
}

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') return fallback;
    throw error;
  }
}

async function main() {
  const currentPath = process.env.SMOKE_RESULT_FILE ?? '.smoke/current.json';
  const historyPath = process.env.SMOKE_HISTORY_FILE ?? '.smoke/history.json';
  const outputPath = process.env.GITHUB_OUTPUT;
  const current = await readJson(currentPath, null);
  if (!current) throw new Error(`Current smoke result is missing: ${currentPath}`);
  const previous = await readJson(historyPath, []);
  const evaluation = evaluateHealthHistory(previous, current);

  await writeFile(historyPath, `${JSON.stringify(evaluation.history, null, 2)}\n`);
  console.log(`Production health history: ${evaluation.reason}`);
  if (evaluation.escalate) {
    console.error(`::error title=Intermittent production health::${evaluation.reason}`);
  } else if (current.status === 'degraded') {
    console.warn(`::warning title=Intermittent production health::${evaluation.reason}`);
  }
  if (outputPath) {
    await writeFile(outputPath, `escalate=${evaluation.escalate}\nreason=${evaluation.reason}\n`, { flag: 'a' });
  }
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main().catch(error => {
    console.error(`Smoke history evaluation failed: ${error.message}`);
    process.exitCode = 1;
  });
}
