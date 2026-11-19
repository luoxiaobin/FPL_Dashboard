import { NextRequest, NextResponse } from 'next/server';
import { getEntryIdFromSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  if (!await getEntryIdFromSession(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const deadline = request.nextUrl.searchParams.get('deadline');
  const deadlineTime = deadline ? Date.parse(deadline) : NaN;
  if (!Number.isFinite(deadlineTime)) {
    return NextResponse.json({ error: 'A valid Gameweek deadline is required.' }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin.from('planning_team_news')
    .select('processed_at, model_name, signals')
    .eq('deadline', new Date(deadlineTime).toISOString())
    .order('processed_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return NextResponse.json({ error: 'Team news is temporarily unavailable.' }, { status: 503 });
  return NextResponse.json({ batch: data }, { headers: { 'Cache-Control': 'private, no-store' } });
}
