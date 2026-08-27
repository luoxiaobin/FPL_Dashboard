import { NextRequest, NextResponse } from 'next/server';
import { getEntryIdFromSession } from '@/lib/session';
import { createFplSyncToken, revokeFplSyncTokens } from '@/server/planning/syncTokenStore';

export async function POST(request: NextRequest) {
  const rawEntryId = await getEntryIdFromSession(request);
  if (!rawEntryId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const entryId = Number(rawEntryId);
    await revokeFplSyncTokens(entryId);
    const pairing = await createFplSyncToken(entryId);
    return NextResponse.json({ entryId, ...pairing });
  } catch (error) {
    console.error('FPL auto-sync pairing error:', error);
    return NextResponse.json({ error: 'Unable to create auto-sync pairing' }, { status: 503 });
  }
}

export async function DELETE(request: NextRequest) {
  const rawEntryId = await getEntryIdFromSession(request);
  if (!rawEntryId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    await revokeFplSyncTokens(Number(rawEntryId));
    return NextResponse.json({ revoked: true });
  } catch (error) {
    console.error('FPL auto-sync revocation error:', error);
    return NextResponse.json({ error: 'Unable to revoke auto-sync pairing' }, { status: 503 });
  }
}
