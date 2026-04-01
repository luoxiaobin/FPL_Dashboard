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

    // Determine current phase (GW 1-19 or GW 20-38)
    const currentGW = data.current_event || 0;
    const isSecondHalf = currentGW >= 20;
    const phaseStart = isSecondHalf ? 20 : 1;
    const phaseEnd = isSecondHalf ? 38 : 19;

    // Standard FPL chip names
    const allChips = ['bboost', '3xc', 'wildcard', 'freehit'];
    
    // Filter used chips to only those used in the CURRENT phase
    const usedInPhase = new Set(
      (history.chips || [])
        .filter((c: any) => c.event >= phaseStart && c.event <= phaseEnd)
        .map((c: any) => c.name)
    );

    const availableChips = allChips.filter(c => !usedInPhase.has(c));

    // Calculate Trend (compare current rank vs 3 GWs ago)
    const currentGWs = history.current;
    let trend = 'Stable';
    if (currentGWs.length >= 4) {
      const now = currentGWs[currentGWs.length - 1].overall_rank;
      const then = currentGWs[currentGWs.length - 4].overall_rank;
      if (now < then * 0.95) trend = 'Improving';
      else if (now > then * 1.05) trend = 'Declining';
    }

    const bootstrapRes = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/', { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const bootstrap = await bootstrapRes.json();

    return NextResponse.json({
      user_id: data.id,
      manager_name: `${data.player_first_name || ''} ${data.player_last_name || ''}`.trim(),
      team_name: data.name,
      overall_rank: data.summary_overall_rank || 0,
      total_points: data.summary_overall_points || 0,
      total_players: bootstrap.total_players || 11000000,
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
