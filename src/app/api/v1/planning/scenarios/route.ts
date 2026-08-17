import { NextRequest, NextResponse } from 'next/server';
import { FplUpstreamError } from '@/server/fpl/client';
import { buildPlanningWorkspace } from '@/server/planning/workspace';
import { getEntryIdFromSession } from '@/lib/session';
import { toSafeId } from '@/lib/upstreamFetch';
import {
  DEFAULT_PLANNING_CONSTRAINTS,
  type PlanningConstraints,
} from '@/server/planning/types';

const numericIds = (value: unknown): number[] => Array.isArray(value)
  ? [...new Set(value.filter(item => Number.isInteger(item) && Number(item) > 0).map(Number))].slice(0, 50)
  : [];

function parseConstraints(value: unknown): PlanningConstraints {
  const body = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return {
    lockedPlayerIds: numericIds(body.lockedPlayerIds),
    excludedPlayerIds: numericIds(body.excludedPlayerIds),
    maxPointsHit: Math.max(0, Math.min(20, Number(body.maxPointsHit) || 0)),
    bankReserve: Math.max(0, Math.min(20, Number(body.bankReserve) || 0)),
  };
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production' && process.env.PLANNING_WORKSPACE_V1 !== 'true') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }
  const rawEntryId = await getEntryIdFromSession(request);
  if (!rawEntryId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const entryId = toSafeId(rawEntryId, 'entryId');

  try {
    const body = await request.json().catch(() => ({}));
    const constraints = parseConstraints(body?.constraints ?? DEFAULT_PLANNING_CONSTRAINTS);
    const workspace = await buildPlanningWorkspace(Number(entryId), constraints);
    return NextResponse.json(workspace);
  } catch (error) {
    console.error('Planning workspace error:', error);
    if (error instanceof FplUpstreamError && error.status === 404) {
      return NextResponse.json({
        error: 'Your current squad is not public yet. Scenario planning becomes available after the Gameweek deadline.',
      }, { status: 409 });
    }
    const message = error instanceof Error && error.message.includes('not available')
      ? error.message
      : 'Unable to generate planning scenarios right now.';
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
