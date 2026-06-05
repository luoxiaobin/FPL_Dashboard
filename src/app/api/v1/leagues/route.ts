import { NextRequest, NextResponse } from 'next/server';
import { fifaFetch } from '@/lib/fifaApi';

export async function GET(req: NextRequest) {
  try {
    const entryId = req.cookies.get('fpl_entry_id')?.value;
    if (!entryId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await fifaFetch(`/entry/${entryId}/`);
    const classicLeagues = data.leagues?.classic || [];

    const leagues = classicLeagues.map((l: any) => {
      let movement = 'same';
      if (l.has_rank && l.rank < l.previous_rank) movement = 'up';
      if (l.has_rank && l.rank > l.previous_rank) movement = 'down';
      return { league_id: l.id, name: l.name, rank: l.rank || l.entry_rank || '-', movement };
    });

    return NextResponse.json({ leagues });
  } catch (error) {
    console.error('Leagues Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
