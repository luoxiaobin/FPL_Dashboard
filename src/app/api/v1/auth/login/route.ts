import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { teamId } = await req.json();

    if (!teamId || !/^\d+$/.test(teamId)) {
      return NextResponse.json({ success: false, error: 'Valid Numeric Team ID required' }, { status: 400 });
    }

    // Ping the public FPL entry endpoint to ensure this team ID actually exists
    const meRes = await fetch(`https://fantasy.premierleague.com/api/entry/${teamId}/`, {
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

    // Persist user profile to Supabase (upsert gracefully handles returning users)
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .upsert(
        { fpl_entry_id: entryId, team_name: teamName },
        { onConflict: 'fpl_entry_id' }
      );

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
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Login Error:', message);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
