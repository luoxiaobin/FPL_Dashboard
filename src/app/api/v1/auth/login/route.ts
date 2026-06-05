import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { FIFA_API_BASE } from '@/lib/fifaApi';

export async function POST(req: NextRequest) {
  try {
    const { teamId } = await req.json();

    if (!teamId || !/^\d+$/.test(teamId)) {
      return NextResponse.json({ success: false, error: 'Valid numeric Team ID required' }, { status: 400 });
    }

    // Validate the FIFA Fantasy team ID against the live API
    const meRes = await fetch(`${FIFA_API_BASE}/entry/${teamId}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
        Accept: 'application/json',
      },
    });

    if (!meRes.ok) {
      if (meRes.status === 404) {
        return NextResponse.json({ success: false, error: 'Team ID not found on FIFA Fantasy.' }, { status: 404 });
      }
      return NextResponse.json({ success: false, error: 'Failed to verify Team ID.' }, { status: 401 });
    }

    const meData = await meRes.json();
    const entryId = meData.id;
    const teamName = meData.name;

    if (!entryId) {
      return NextResponse.json({ success: false, error: 'Invalid response from FIFA API.' }, { status: 404 });
    }

    const { error: dbError } = await supabaseAdmin
      .from('users')
      .upsert(
        { fpl_entry_id: entryId, team_name: teamName },
        { onConflict: 'fpl_entry_id' }
      );

    if (dbError) {
      console.error('Supabase upsert error:', dbError.message);
    }

    const response = NextResponse.json({ success: true, entryId });

    response.cookies.set({
      name: 'fpl_entry_id',
      value: entryId.toString(),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Login Error:', message);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
