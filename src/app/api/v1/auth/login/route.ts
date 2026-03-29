import { NextRequest, NextResponse } from 'next/server';

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

    if (!entryId) {
      return NextResponse.json({ success: false, error: 'Invalid response from FPL.' }, { status: 404 });
    }

    const response = NextResponse.json({ success: true, entryId });

    // Store purely the public entry_id
    response.cookies.set({
      name: 'fpl_entry_id',
      value: entryId.toString(),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 365 // 1 year cookie since it's just public data!
    });

    // Note: We are NO LONGER setting secure `pl_profile` or `session` cookies!
    // FPL Dashboards running off Option 1 only require the Team ID.

    return response;

  } catch (error: any) {
    console.error('Login Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
