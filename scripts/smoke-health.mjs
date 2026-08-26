const DEFAULT_ATTEMPTS = 3;
const DEFAULT_BACKOFF_MS = 2_000;
const MAX_DIAGNOSTIC_LENGTH = 1_000;

const sleep = (milliseconds) => new Promise(resolve => setTimeout(resolve, milliseconds));

function positiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

async function responseDiagnostic(response) {
  const body = (await response.text()).slice(0, MAX_DIAGNOSTIC_LENGTH);
  return {
    body,
    message: `HTTP ${response.status}${body ? `; body: ${body}` : ''}`,
  };
}

export async function requestHealthyResponse(request, options = {}) {
  const attempts = positiveInteger(options.attempts, DEFAULT_ATTEMPTS);
  const backoffMs = positiveInteger(options.backoffMs, DEFAULT_BACKOFF_MS);
  const wait = options.wait ?? sleep;
  const warn = options.warn ?? console.warn;
  let lastDiagnostic = 'no response received';

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await request();
      const diagnostic = await responseDiagnostic(response);
      if (response.status === 200) {
        let body;
        try {
          body = JSON.parse(diagnostic.body);
        } catch {
          throw new Error(`Health returned invalid JSON; body: ${diagnostic.body || '<empty>'}`);
        }
        return { response, body, attempt };
      }
      lastDiagnostic = diagnostic.message;
    } catch (error) {
      lastDiagnostic = error instanceof Error ? error.message : String(error);
    }

    if (attempt < attempts) {
      warn(`Health attempt ${attempt}/${attempts} failed (${lastDiagnostic}); retrying in ${backoffMs * attempt}ms`);
      await wait(backoffMs * attempt);
    }
  }

  throw new Error(`Health check failed after ${attempts} attempts. Last result: ${lastDiagnostic}`);
}

