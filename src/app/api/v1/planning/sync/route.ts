import { NextRequest, NextResponse } from 'next/server';
import { parseFplSquadImport, FplSquadImportValidationError } from '@/lib/fplSquadImport';
import { fetchFplJson } from '@/server/fpl/client';
import { validateImportedSquadForPlanning, PlanningSquadValidationError } from '@/server/planning/importedSquad';
import { saveConfirmedSquadImport } from '@/server/planning/importStore';
import { resolveFplSyncToken } from '@/server/planning/syncTokenStore';
import { selectPlanningGameweek } from '@/server/planning/gameweekLifecycle';
import type { Position } from '@/server/planning/types';

const FPL_ORIGIN = 'https://fantasy.premierleague.com';
const corsHeaders = {
  'Access-Control-Allow-Origin': FPL_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Max-Age': '86400',
  Vary: 'Origin',
};

interface BootstrapPayload {
  events: Array<{ id: number; is_current: boolean; is_next: boolean; finished: boolean; deadline_time: string }>;
  elements: Array<{ id: number; team: number; element_type: number }>;
}

const position = (value: number): Position => {
  if (value < 1 || value > 4) throw new PlanningSquadValidationError('FPL returned an unsupported player position');
  return value as Position;
};

const response = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: corsHeaders });

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  if (request.headers.get('origin') !== FPL_ORIGIN) {
    return response({ error: 'Untrusted sync origin' }, 403);
  }
  const authorization = request.headers.get('authorization') ?? '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  const entryId = await resolveFplSyncToken(token);
  if (!entryId) return response({ error: 'Auto-sync pairing is invalid or expired' }, 401);

  try {
    const imported = parseFplSquadImport((await request.json())?.importedSquad);
    if (imported.entryId !== entryId) return response({ error: 'Squad entry does not match this pairing' }, 403);
    const bootstrap = await fetchFplJson<BootstrapPayload>('/api/bootstrap-static/', { cacheSeconds: 300 });
    const event = selectPlanningGameweek(bootstrap.events);
    const expiresAt = new Date(Date.parse(event.deadline_time) + 2 * 60 * 60_000);
    validateImportedSquadForPlanning(imported, entryId, bootstrap.elements.map(player => ({
      id: player.id,
      teamId: player.team,
      position: position(player.element_type),
    })), new Date(), expiresAt);
    const stored = await saveConfirmedSquadImport(imported, expiresAt);
    return response({
      synced: true,
      capturedAt: stored.payload.capturedAt,
      expiresAt: stored.expiresAt,
      gameweek: event.id,
    });
  } catch (error) {
    if (error instanceof FplSquadImportValidationError) return response({ error: 'FPL returned an invalid squad payload' }, 400);
    if (error instanceof PlanningSquadValidationError) return response({ error: error.message }, 422);
    console.error('FPL auto-sync error:', error);
    return response({ error: 'Unable to save the automatically synced squad' }, 503);
  }
}
