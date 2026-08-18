import { NextRequest, NextResponse } from 'next/server';
import { getEntryIdFromSession } from '@/lib/session';
import { FplSquadImportValidationError, parseFplSquadImport } from '@/lib/fplSquadImport';
import { fetchFplJson } from '@/server/fpl/client';
import { PlanningSquadValidationError, validateImportedSquadForPlanning } from '@/server/planning/importedSquad';
import {
  clearConfirmedSquadImport,
  loadConfirmedSquadImport,
  saveConfirmedSquadImport,
} from '@/server/planning/importStore';
import type { Position } from '@/server/planning/types';

interface BootstrapPayload {
  events: Array<{ is_current: boolean; is_next: boolean; deadline_time: string }>;
  elements: Array<{ id: number; team: number; element_type: number }>;
}

const position = (value: number): Position => {
  if (value < 1 || value > 4) throw new PlanningSquadValidationError('FPL returned an unsupported player position');
  return value as Position;
};

async function authenticatedEntryId(request: NextRequest): Promise<number | null> {
  const value = await getEntryIdFromSession(request);
  return value ? Number(value) : null;
}

export async function GET(request: NextRequest) {
  const entryId = await authenticatedEntryId(request);
  if (!entryId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const stored = await loadConfirmedSquadImport(entryId);
    return NextResponse.json({
      confirmed: Boolean(stored),
      capturedAt: stored?.payload.capturedAt ?? null,
      confirmedAt: stored?.confirmedAt ?? null,
      expiresAt: stored?.expiresAt ?? null,
    });
  } catch {
    return NextResponse.json({ error: 'Unable to load confirmed squad' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const entryId = await authenticatedEntryId(request);
  if (!entryId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const imported = parseFplSquadImport(body?.importedSquad);
    const bootstrap = await fetchFplJson<BootstrapPayload>('/api/bootstrap-static/', { cacheSeconds: 300 });
    const event = bootstrap.events.find(candidate => candidate.is_current)
      ?? bootstrap.events.find(candidate => candidate.is_next)
      ?? bootstrap.events[0];
    if (!event) throw new PlanningSquadValidationError('FPL has no available Gameweek');
    const expiresAt = new Date(Date.parse(event.deadline_time) + 2 * 60 * 60_000);
    validateImportedSquadForPlanning(imported, entryId, bootstrap.elements.map(player => ({
      id: player.id,
      teamId: player.team,
      position: position(player.element_type),
    })), new Date(), expiresAt);
    const stored = await saveConfirmedSquadImport(imported, expiresAt);
    return NextResponse.json({
      confirmed: true,
      capturedAt: stored.payload.capturedAt,
      confirmedAt: stored.confirmedAt,
      expiresAt: stored.expiresAt,
    });
  } catch (error) {
    if (error instanceof FplSquadImportValidationError) {
      return NextResponse.json({ error: 'The confirmed squad payload is invalid' }, { status: 400 });
    }
    if (error instanceof PlanningSquadValidationError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    console.error('Confirmed squad save error:', error);
    return NextResponse.json({ error: 'Unable to save confirmed squad' }, { status: 503 });
  }
}

export async function DELETE(request: NextRequest) {
  const entryId = await authenticatedEntryId(request);
  if (!entryId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    await clearConfirmedSquadImport(entryId);
    return NextResponse.json({ confirmed: false });
  } catch {
    return NextResponse.json({ error: 'Unable to clear confirmed squad' }, { status: 503 });
  }
}
