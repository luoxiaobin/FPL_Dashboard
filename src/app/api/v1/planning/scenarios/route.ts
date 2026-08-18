import { NextRequest, NextResponse } from 'next/server';
import { FplUpstreamError } from '@/server/fpl/client';
import { buildPlanningWorkspace } from '@/server/planning/workspace';
import { getEntryIdFromSession } from '@/lib/session';
import { toSafeId } from '@/lib/upstreamFetch';
import {
  DEFAULT_PLANNING_CONSTRAINTS,
  type PlanningConstraints,
} from '@/server/planning/types';
import { parseFplSquadImport, FplSquadImportValidationError } from '@/lib/fplSquadImport';
import { PlanningSquadValidationError } from '@/server/planning/importedSquad';
import { loadConfirmedSquadImport } from '@/server/planning/importStore';

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
    const requestImport = body?.importedSquad === undefined ? undefined : parseFplSquadImport(body.importedSquad);
    if (requestImport && requestImport.entryId !== Number(entryId)) {
      throw new PlanningSquadValidationError('The imported squad belongs to a different FPL entry');
    }
    let storedImport = null;
    if (!requestImport) {
      try {
        storedImport = await loadConfirmedSquadImport(Number(entryId));
      } catch (error) {
        console.error('Confirmed squad store unavailable; continuing with public FPL picks:', error);
      }
    }
    const importedSquad = requestImport ?? storedImport?.payload;
    const workspace = await buildPlanningWorkspace(Number(entryId), constraints, importedSquad);
    return NextResponse.json(workspace);
  } catch (error) {
    console.error('Planning workspace error:', error);
    if (error instanceof FplSquadImportValidationError) {
      return NextResponse.json({ error: 'The confirmed squad payload is invalid. Import it again.' }, { status: 400 });
    }
    if (error instanceof PlanningSquadValidationError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    if (error instanceof FplUpstreamError && error.status === 404) {
      return NextResponse.json({
        error: 'Your current squad is not public yet. Refresh your saved squad import, or try again after the Gameweek deadline.',
      }, { status: 409 });
    }
    const message = error instanceof Error && error.message.includes('not available')
      ? error.message
      : 'Unable to generate planning scenarios right now.';
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
