import { NextRequest, NextResponse } from 'next/server';
import { getEntryIdFromSession } from '@/lib/session';
import { loadLatestMyPlan, saveMyPlan } from '@/server/planning/reproducibilityStore';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function entryId(request: NextRequest): Promise<number | null> {
  const value = await getEntryIdFromSession(request);
  return value ? Number(value) : null;
}

export async function GET(request: NextRequest) {
  const authenticatedEntryId = await entryId(request);
  if (!authenticatedEntryId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const gameweekValue = new URL(request.url).searchParams.get('gameweek');
    const gameweek = gameweekValue && /^([1-9]|[1-2][0-9]|3[0-8])$/.test(gameweekValue)
      ? Number(gameweekValue)
      : undefined;
    return NextResponse.json({ plan: await loadLatestMyPlan(authenticatedEntryId, gameweek) });
  } catch (error) {
    console.error('My Plan load error:', error);
    return NextResponse.json({ error: 'Unable to load My Plan' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const authenticatedEntryId = await entryId(request);
  if (!authenticatedEntryId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    if (typeof body?.scenarioId !== 'string' || !UUID.test(body.scenarioId)) {
      return NextResponse.json({ error: 'A valid scenario ID is required' }, { status: 400 });
    }
    return NextResponse.json({ plan: await saveMyPlan(authenticatedEntryId, body.scenarioId) });
  } catch (error) {
    console.error('My Plan save error:', error);
    const reason = error instanceof Error ? error.message : '';
    const message = reason.includes('different FPL entry') || reason.includes('deadline has passed')
      ? reason
      : 'Unable to save My Plan';
    const status = reason.includes('different FPL entry') ? 403 : reason.includes('deadline has passed') ? 409 : 503;
    return NextResponse.json({ error: message }, { status });
  }
}
