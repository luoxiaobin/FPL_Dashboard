const baseUrl = (process.env.SMOKE_BASE_URL ?? 'https://fpl-dashboard-seven-pi.vercel.app').replace(/\/$/, '');

async function request(path, init) {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: 'manual',
    signal: AbortSignal.timeout(15_000),
    ...init,
  });
  return response;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function run() {
  const health = await request('/api/v1/health');
  const healthBody = await health.json();
  assert(health.status === 200, `Health returned ${health.status}`);
  assert(healthBody.status === 'ready', `Health status is ${healthBody.status}`);
  assert(healthBody.checks?.configuration === 'pass', 'Configuration check did not pass');
  assert(healthBody.checks?.database === 'pass', 'Database check did not pass');
  assert(healthBody.checks?.fpl === 'pass', 'FPL upstream check did not pass');
  assert(/^\d+\.\d+\.\d+$/.test(healthBody.release?.version ?? ''), 'Release version is missing');
  assert(healthBody.release?.shortCommitSha, 'Release commit is missing');

  const planningPage = await request('/planning');
  assert(planningPage.status === 200, `Planning page returned ${planningPage.status}`);
  const planningHtml = await planningPage.text();
  assert(planningHtml.includes('FPL planning workspace'), 'Planning feature flag is not active');

  const contract = await request('/api/v1/planning/import-contract');
  const contractBody = await contract.json();
  assert(contract.status === 200, `Import contract returned ${contract.status}`);
  assert(contractBody.status === 'ready', 'Import contract is not ready');
  assert(contractBody.contract?.schemaVersion === 1, 'Import schema version is incorrect');
  assert(contractBody.contract?.persistence === 'confirmed-server-side', 'Confirmed import persistence is not active');
  assert(contractBody.contract?.publicPicksHandoff === 'automatic', 'Public picks handoff is not active');

  const summary = await request('/api/v1/user/summary');
  assert(summary.status === 401, `Unauthenticated summary returned ${summary.status}, expected 401`);

  const scenarios = await request('/api/v1/planning/scenarios', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  });
  assert(scenarios.status === 401, `Unauthenticated planning API returned ${scenarios.status}, expected 401`);

  for (const method of ['GET', 'POST', 'DELETE']) {
    const importedSquad = await request('/api/v1/planning/import', {
      method,
      ...(method === 'POST' ? { headers: { 'content-type': 'application/json' }, body: '{}' } : {}),
    });
    assert(importedSquad.status === 401, `Unauthenticated import ${method} returned ${importedSquad.status}, expected 401`);
  }

  const requiredHeaders = {
    'x-frame-options': 'DENY',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
  };
  for (const [name, expected] of Object.entries(requiredHeaders)) {
    assert(health.headers.get(name) === expected, `${name} header is missing or incorrect`);
  }

  console.log(`Production smoke test passed: ${baseUrl}`);
  console.log(`  release: v${healthBody.release.version} · ${healthBody.release.shortCommitSha}`);
  console.log('  health: configuration, database, and FPL ready');
  console.log('  planning page: enabled');
  console.log('  confirmed import contract: ready');
  console.log('  protected APIs: reject unauthenticated requests');
  console.log('  security headers: present');
}

run().catch((error) => {
  console.error(`Production smoke test failed: ${error.message}`);
  process.exitCode = 1;
});
