import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createSession, setSessionCookie } from '@/lib/session';
import { fplFetch, toSafeId } from '@/lib/upstreamFetch';

export async function POST(req: NextRequest) {
  try {
    const { teamId } = await req.json();

    if (!teamId || !/^\d+$/.test(teamId)) {
      return NextResponse.json({ success: false, error: 'Valid Numeric Team ID required' }, { status: 400 });
    }

    // Ping the public FPL entry endpoint to ensure this team ID actually exists
    const meRes = await fplFetch(`/api/entry/${toSafeId(teamId, 'teamId')}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });

    if (!meRes.ok) {
      if (meRes.status === 404) {
        return NextResponse.json({ success: false, error: 'Team ID not found on FPL servers.' }, { status: 404 });
      }
      return NextResponse.json({ success: false, error: 'Failed to verify Team ID.' }, { status: 401 });
    }

    const meData = await meRes.json();
    const entryId = meData.id;
    const teamName = meData.name;

    if (!entryId) {
      return NextResponse.json({ success: false, error: 'Invalid response from FPL.' }, { status: 404 });
    }

    // HTML-encode teamName before persisting — it originates from the external FPL API
    // and is rendered elsewhere in the app, so it must not be trusted as-is.
    const sanitize = (s: string) =>
      s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c] as string));
    const safeTeamName = sanitize(teamName ?? '');

    // Persist user profile to Supabase (upsert gracefully handles returning users)
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .upsert(
        { fpl_entry_id: entryId, team_name: safeTeamName },
        { onConflict: 'fpl_entry_id' }
      );

    if (dbError) {
      // Log but don't block login — DB write is best-effort
      console.error('Supabase upsert error:', dbError.message);
    }

    // H1 fix: issue a random session token mapped to the entry ID server-side,
    // rather than handing the client a cookie containing the raw entry ID.
    const token = await createSession(entryId);

    const response = NextResponse.json({ success: true, entryId });
    setSessionCookie(response, token);

    return response;

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Login Error:', message);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
