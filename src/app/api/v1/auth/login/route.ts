import { NextRequest, NextResponse } from 'next/server';
import { FplApiError, getBootstrap, getEntry } from '@/lib/fpl/client';
import { seasonCodeFromEvents } from '@/lib/fpl/gameweekContext';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { teamId } = await req.json();

    if (!teamId || !/^\d+$/.test(teamId)) {
      return NextResponse.json({ success: false, error: 'Valid Numeric Team ID required' }, { status: 400 });
    }

    const meData = await getEntry<Record<string, any>>(teamId);

    const entryId = meData.id;
    const teamName = meData.name;

    if (!entryId) {
      return NextResponse.json({ success: false, error: 'Invalid response from FPL.' }, { status: 404 });
    }

    // Persist the profile in the active season scope when the additive migration
    // is present; retain the legacy path for pre-migration local environments.
    let userPayload: Record<string, unknown> = { fpl_entry_id: entryId, team_name: teamName };
    let onConflict = 'fpl_entry_id';
    try {
      const bootstrap = await getBootstrap();
      const seasonCode = seasonCodeFromEvents(bootstrap.events);
      const { data: season } = await supabaseAdmin.from('seasons').select('id').eq('code', seasonCode).maybeSingle();
      if (season?.id) {
        userPayload = { ...userPayload, season_id: season.id };
        onConflict = 'season_id,fpl_entry_id';
      }
    } catch {
      // Login should remain usable if season metadata is unavailable.
    }

    const { error: dbError } = await supabaseAdmin.from('users').upsert(userPayload, { onConflict });
    if (dbError) {
      // Log but don't block login — DB write is best-effort
      console.error('Supabase upsert error:', dbError.message);
    }

    const response = NextResponse.json({ success: true, entryId });

    // Store purely the public entry_id in a secure cookie
    response.cookies.set({
      name: 'fpl_entry_id',
      value: entryId.toString(),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 365 // 1 year
    });

    return response;

  } catch (error: unknown) {
    if (error instanceof FplApiError) {
      const status = error.code === 'not_found' ? 404 : error.status;
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status });
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Login Error:', message);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
