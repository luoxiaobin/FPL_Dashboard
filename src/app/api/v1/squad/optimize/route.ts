import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getEntryIdFromSession } from '@/lib/session';
import { fplFetch, toSafeId } from '@/lib/upstreamFetch';
import { resolveRelevantGameweek, squadUnpublishedPayload } from '@/lib/fplAvailability';

export async function POST(req: NextRequest) {
  try {
    const rawEntryId = await getEntryIdFromSession(req);
    if (!rawEntryId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const entryId = toSafeId(rawEntryId, 'entryId');

    // 1. Fetch bootstrap to get current GW
    const bootstrapRes = await fplFetch('/api/bootstrap-static/', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    if (!bootstrapRes.ok) {
        return NextResponse.json({ error: 'Failed to fetch FPL bootstrap' }, { status: 500 });
    }

    const bootstrap = await bootstrapRes.json();
    const teamMap = new Map(bootstrap.teams.map((t: any) => [t.id, { code: t.code, short_name: t.short_name }]));
    const currentGWData = resolveRelevantGameweek(bootstrap.events);
    if (!currentGWData) return NextResponse.json({ error: 'No gameweek available' }, { status: 404 });
    const targetGW = (currentGWData.finished && currentGWData.id < 38) ? currentGWData.id + 1 : currentGWData.id;

    // 2. Fetch user's picks for current GW
    const picksRes = await fplFetch(`/api/entry/${entryId}/event/${toSafeId(currentGWData.id, 'gameweek')}/picks/`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    if (picksRes.status === 404 && currentGWData.is_next) {
        return NextResponse.json({
          ...squadUnpublishedPayload(currentGWData),
          suggestions: [],
        });
    }
    if (!picksRes.ok) {
        throw new Error(`Failed to fetch squad data (${picksRes.status})`);
    }
    const picksData = await picksRes.json();

    const userSquadIds = new Set(picksData.picks.map((p: any) => p.element));
    // Build sell-price map from picks (FPL depreciates sell price when a player rises in value)
    const sellPriceMap = new Map<number, number>(
      picksData.picks.map((p: { element: number; selling_price: number }) => [p.element, p.selling_price])
    );
    const squadPlayers = bootstrap.elements.filter((p: any) => userSquadIds.has(p.id));
    const availablePlayers = bootstrap.elements.filter((p: any) => !userSquadIds.has(p.id));

    // 3. Simple V1 Optimization Algorithm
    const squadPlayersSorted = squadPlayers.sort((a: any, b: any) => parseFloat(a.ep_next || '0') - parseFloat(b.ep_next || '0'));
    const suggestions: any[] = [];

    const bankBalance = picksData.entry_history?.bank || 0;

    for (let i = 0; i < Math.min(3, squadPlayersSorted.length); i++) {
        const outPlayer = squadPlayersSorted[i];
        // Use actual sell price (accounts for FPL price-rise depreciation)
        const outSellPrice = sellPriceMap.get(outPlayer.id) ?? outPlayer.now_cost;

        const bestReplacements = availablePlayers
            .filter((p: any) => p.element_type === outPlayer.element_type && p.now_cost <= (outSellPrice + bankBalance))
            .sort((a: any, b: any) => parseFloat(b.ep_next || '0') - parseFloat(a.ep_next || '0'));

        const inPlayer = bestReplacements[0];

        if (inPlayer) {
            const expectedGain = parseFloat(inPlayer.ep_next || '0') - parseFloat(outPlayer.ep_next || '0');

            if (expectedGain > 0) {
                const outTeam = teamMap.get(outPlayer.team) as { code: number; short_name: string } | undefined;
                const inTeam  = teamMap.get(inPlayer.team)  as { code: number; short_name: string } | undefined;
                suggestions.push({
                    out_id: outPlayer.id,
                    in_id: inPlayer.id,
                    expected_gain: Number(expectedGain.toFixed(1)),
                    out_name: outPlayer.web_name,
                    in_name: inPlayer.web_name,
                    out_team_code: outTeam?.code ?? null,
                    in_team_code:  inTeam?.code  ?? null,
                    out_club: outTeam?.short_name ?? null,
                    in_club:  inTeam?.short_name  ?? null,
                    rationale: `${inPlayer.web_name} provides higher expected points (${inPlayer.ep_next}) compared to ${outPlayer.web_name} (${outPlayer.ep_next}) while remaining within budget constraints.`
                });
            }
        }
    }

    // 4. Log suggestions to Supabase
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('fpl_entry_id', entryId)
      .single();

    if (user && suggestions.length > 0) {
        const logsToInsert = suggestions.map((s) => ({
            user_id: user.id,
            gameweek_id: targetGW,
            out_player_id: s.out_id,
            in_player_id: s.in_id,
            expected_gain: s.expected_gain,
            rationale: s.rationale,
            outcome: 'Pending'
        }));

        const { error: insertError } = await supabaseAdmin
            .from('recommendation_logs')
            .insert(logsToInsert);

        if (insertError) {
             console.error('Error logging recommendations:', insertError);
        }
    }

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Optimizer Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
