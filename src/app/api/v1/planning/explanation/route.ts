import { NextRequest, NextResponse } from 'next/server';
import { getEntryIdFromSession } from '@/lib/session';
import { explainSavedPlan } from '@/server/planning/explanation';
import { loadLatestMyPlan } from '@/server/planning/reproducibilityStore';

export async function POST(request: NextRequest) {
  const entryId = await getEntryIdFromSession(request);
  if (!entryId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (typeof body?.scenarioId !== 'string') {
    return NextResponse.json({ error: 'A saved scenario ID is required.' }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Plan explanations are unavailable until Anthropic is configured.' }, { status: 503 });
  }
  try {
    const plan = await loadLatestMyPlan(Number(entryId));
    if (!plan || plan.scenarioId !== body.scenarioId) {
      return NextResponse.json({ error: 'This scenario is not your latest saved plan.' }, { status: 404 });
    }
    return NextResponse.json({ explanation: await explainSavedPlan(plan, apiKey) });
  } catch (error) {
    console.error('Planning explanation failed:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Could not explain this plan. Try again in a moment.' }, { status: 503 });
  }
}
