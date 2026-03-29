import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const entryId = req.cookies.get('fpl_entry_id')?.value;

    if (!entryId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const res = await fetch(`https://fantasy.premierleague.com/api/entry/${entryId}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        return NextResponse.json({ error: 'Session expired' }, { status: 401 });
      }
      return NextResponse.json({ error: 'FPL API Error' }, { status: res.status });
    }

    const data = await res.json();

    return NextResponse.json({
      user_id: data.id,
      team_name: data.name,
      overall_rank: data.summary_overall_rank || 0,
      total_points: data.summary_overall_points || 0,
      bank_balance: (data.last_deadline_bank || 0) / 10,
      transfers_available: data.last_deadline_total_transfers || 0
    });
  } catch (error) {
    console.error('User Summary Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
