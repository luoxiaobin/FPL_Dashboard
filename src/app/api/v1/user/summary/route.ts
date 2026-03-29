import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const entryId = req.cookies.get('fpl_entry_id')?.value;

    if (!entryId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [entryRes, historyRes] = await Promise.all([
      fetch(`https://fantasy.premierleague.com/api/entry/${entryId}/`, { headers: { 'User-Agent': 'Mozilla/5.0' } }),
      fetch(`https://fantasy.premierleague.com/api/entry/${entryId}/history/`, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    ]);

    if (!entryRes.ok || !historyRes.ok) throw new Error('FPL API Error');

    const data = await entryRes.json();
    const history = await historyRes.json();

    const usedChips = new Set(history.chips.map((c: any) => c.name));
    const allChips = ['bboost', '3xc', 'wildcard', 'freehit'];
    // Note: FPL has 2 wildcards, but for simplicity we'll show the main categories
    const availableChips = allChips.filter(c => !usedChips.has(c));

    // Calculate Trend (compare current rank vs 3 GWs ago)
    const currentGWs = history.current;
    let trend = 'Stable';
    if (currentGWs.length >= 4) {
      const now = currentGWs[currentGWs.length - 1].overall_rank;
      const then = currentGWs[currentGWs.length - 4].overall_rank;
      if (now < then * 0.95) trend = 'Improving';
      else if (now > then * 1.05) trend = 'Declining';
    }

    return NextResponse.json({
      user_id: data.id,
      team_name: data.name,
      overall_rank: data.summary_overall_rank || 0,
      total_points: data.summary_overall_points || 0,
      bank_balance: (data.last_deadline_bank || 0) / 10,
      total_value: (data.last_deadline_value + (data.last_deadline_bank || 0)) / 10,
      available_chips: availableChips,
      trend: trend,
      transfers_available: data.last_deadline_total_transfers || 0
    });
  } catch (error) {
    console.error('User Summary Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
