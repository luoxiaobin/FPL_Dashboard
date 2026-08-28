import { NextResponse } from 'next/server';
import { fetchFplJson } from '@/server/fpl/client';
import { getReleaseIdentity } from '@/lib/release';
import { inspectConfirmedSquadImportStore } from '@/server/planning/importStore';
import { inspectPlanningReproducibilityStore } from '@/server/planning/reproducibilityStore';

interface BootstrapHealth {
  events?: unknown[];
  elements?: unknown[];
}

export async function GET() {
  const release = getReleaseIdentity();
  const configurationReady = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL
    && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  const [bootstrapResult, databaseResult] = await Promise.all([
    fetchFplJson<BootstrapHealth>('/api/bootstrap-static/', {
      cacheSeconds: 300,
      retries: 0,
      timeoutMs: 5_000,
    }).then(data => ({ data, error: null })).catch(error => ({ data: null, error })),
    configurationReady ? Promise.all([
      inspectConfirmedSquadImportStore(),
      inspectPlanningReproducibilityStore(),
    ]).then(([confirmedSquadImports, planning]) => ({ confirmedSquadImports, ...planning }))
      .catch(error => ({ databaseProbe: {
        ready: false,
        error: error instanceof Error ? error.message : 'Unknown database failure',
      } })) : Promise.resolve({ configuration: { ready: false, error: 'Database is not configured' } }),
  ]);
  if (bootstrapResult.error) {
    const reason = bootstrapResult.error instanceof Error ? bootstrapResult.error.message : 'Unknown FPL failure';
    console.error('Production health FPL check failed:', reason);
  }
  const bootstrap = bootstrapResult.data;
  const upstreamReady = Boolean(bootstrap && Array.isArray(bootstrap.events) && Array.isArray(bootstrap.elements));
  const databaseChecks = Object.fromEntries(Object.entries(databaseResult).map(([name, result]) => [
    name,
    result.ready ? 'pass' : 'fail',
  ]));
  const failedDatabaseChecks = Object.entries(databaseResult).filter(([, result]) => !result.ready);
  for (const [name, result] of failedDatabaseChecks) {
    console.error(`Production health database check failed (${name}):`, result.error ?? 'Unknown database failure');
  }
  const databaseReady = configurationReady && failedDatabaseChecks.length === 0;
  const ready = configurationReady && databaseReady && upstreamReady;

  return NextResponse.json({
    status: ready ? 'ready' : 'degraded',
    checks: {
      configuration: configurationReady ? 'pass' : 'fail',
      database: databaseReady ? 'pass' : 'fail',
      fpl: upstreamReady ? 'pass' : 'fail',
    },
    details: {
      database: databaseChecks,
    },
    release,
    timestamp: new Date().toISOString(),
  }, { status: ready ? 200 : 503 });
}
