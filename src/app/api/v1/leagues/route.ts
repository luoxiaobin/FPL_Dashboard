import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const entryId = req.cookies.get('fpl_entry_id')?.value;

    if (!entryId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Leagues are available on the main entry endpoint
    const res = await fetch(`https://fantasy.premierleague.com/api/entry/${entryId}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'FPL API Error' }, { status: res.status });
    }

    const data = await res.json();
    const classicLeagues = data.leagues?.classic || [];

    const formattedLeagues = classicLeagues.map((l: any) => {
      let movement = 'same';
      if (l.has_rank && l.rank < l.previous_rank) movement = 'up';
      if (l.has_rank && l.rank > l.previous_rank) movement = 'down';

      return {
        league_id: l.id,
        name: l.name,
        rank: l.rank || l.entry_rank || '-',
        movement
      };
    });

    return NextResponse.json({ leagues: formattedLeagues });

  } catch (error) {
    console.error('Leagues Proxy Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
