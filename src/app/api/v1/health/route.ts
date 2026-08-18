import { NextResponse } from 'next/server';
import { fetchFplJson } from '@/server/fpl/client';
import { getReleaseIdentity } from '@/lib/release';
import { checkConfirmedSquadImportStore } from '@/server/planning/importStore';

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

  const [bootstrap, databaseReady] = await Promise.all([
    fetchFplJson<BootstrapHealth>('/api/bootstrap-static/', {
      cacheSeconds: 300,
      retries: 0,
      timeoutMs: 5_000,
    }).catch(() => null),
    configurationReady ? checkConfirmedSquadImportStore().catch(() => false) : Promise.resolve(false),
  ]);
  const upstreamReady = Boolean(bootstrap && Array.isArray(bootstrap.events) && Array.isArray(bootstrap.elements));
  const ready = configurationReady && databaseReady && upstreamReady;

  return NextResponse.json({
    status: ready ? 'ready' : 'degraded',
    checks: {
      configuration: configurationReady ? 'pass' : 'fail',
      database: databaseReady ? 'pass' : 'fail',
      fpl: upstreamReady ? 'pass' : 'fail',
    },
    release,
    timestamp: new Date().toISOString(),
  }, { status: ready ? 200 : 503 });
}
