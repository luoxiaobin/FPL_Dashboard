import { NextRequest, NextResponse } from 'next/server';
import { FplApiError, getEntry } from '@/lib/fpl/client';

export async function GET(req: NextRequest) {
  try {
    const entryId = req.cookies.get('fpl_entry_id')?.value;

    if (!entryId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await getEntry<Record<string, any>>(entryId);

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
