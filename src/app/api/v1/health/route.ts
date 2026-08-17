import { NextResponse } from 'next/server';
import { fetchFplJson } from '@/server/fpl/client';

interface BootstrapHealth {
  events?: unknown[];
  elements?: unknown[];
}

export async function GET() {
  const configurationReady = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL
    && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  try {
    const bootstrap = await fetchFplJson<BootstrapHealth>('/api/bootstrap-static/', {
      cacheSeconds: 300,
      retries: 0,
      timeoutMs: 5_000,
    });
    const upstreamReady = Array.isArray(bootstrap.events) && Array.isArray(bootstrap.elements);
    const ready = configurationReady && upstreamReady;

    return NextResponse.json({
      status: ready ? 'ready' : 'degraded',
      checks: {
        configuration: configurationReady ? 'pass' : 'fail',
        fpl: upstreamReady ? 'pass' : 'fail',
      },
      timestamp: new Date().toISOString(),
    }, { status: ready ? 200 : 503 });
  } catch {
    return NextResponse.json({
      status: 'degraded',
      checks: {
        configuration: configurationReady ? 'pass' : 'fail',
        fpl: 'fail',
      },
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}

