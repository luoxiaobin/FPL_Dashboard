import { NextRequest, NextResponse } from 'next/server';
import { FplApiError, getBootstrap, getPicks } from '@/lib/fpl/client';
import { resolveGameweekContext } from '@/lib/fpl/gameweekContext';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const entryId = req.cookies.get('fpl_entry_id')?.value;
    if (!entryId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const bootstrap = await getBootstrap();
    const teamMap = new Map(bootstrap.teams.map((t: any) => [t.id, { code: t.code, short_name: t.short_name }]));
    const context = resolveGameweekContext(bootstrap.events);
    const { data: season } = await supabaseAdmin.from('seasons').select('id').eq('code', context.seasonCode).maybeSingle();
    const currentGW = context.picksGW ?? context.planningGW;
    const targetGW = context.planningGW ?? currentGW;
    if (!currentGW || !targetGW) return NextResponse.json({ error: 'FPL gameweek data is not available', code: context.state }, { status: 409 });

    const picksData = await getPicks(entryId, currentGW);
    
    const userSquadIds = new Set(picksData.picks.map((p: any) => p.element));
    // Build sell-price map from picks (FPL depreciates sell price when a player rises in value)
    const sellPriceMap = new Map<number, number>(
      picksData.picks.map((p) => [p.element, p.selling_price ?? 0] as [number, number])
    );
    const squadPlayers = bootstrap.elements.filter((p: any) => userSquadIds.has(p.id));
    const availablePlayers = bootstrap.elements.filter((p: any) => !userSquadIds.has(p.id));

    // 3. Simple V1 Optimization Algorithm
    const squadPlayersSorted = squadPlayers.sort((a: any, b: any) => parseFloat(String(a.ep_next || '0')) - parseFloat(String(b.ep_next || '0')));
    const suggestions: any[] = [];

    const bankBalance = Number(picksData.entry_history?.bank || 0);

    for (let i = 0; i < Math.min(3, squadPlayersSorted.length); i++) {
        const outPlayer = squadPlayersSorted[i];
        // Use actual sell price (accounts for FPL price-rise depreciation)
        const outSellPrice = Number(sellPriceMap.get(outPlayer.id) ?? outPlayer.now_cost ?? 0);

        const bestReplacements = availablePlayers
            .filter((p: any) => p.element_type === outPlayer.element_type && p.now_cost <= (outSellPrice + bankBalance))
            .sort((a: any, b: any) => parseFloat(String(b.ep_next || '0')) - parseFloat(String(a.ep_next || '0')));

        const inPlayer = bestReplacements[0];

        if (inPlayer) {
            const expectedGain = parseFloat(String(inPlayer.ep_next || '0')) - parseFloat(String(outPlayer.ep_next || '0'));
            
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
    let userQuery = supabaseAdmin.from('users').select('id').eq('fpl_entry_id', entryId);
    if (season?.id) userQuery = userQuery.eq('season_id', season.id);
    const { data: user } = await userQuery.single();

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
    if (error instanceof FplApiError) return NextResponse.json({ error: error.message, code: error.code, path: error.path }, { status: error.status });
    console.error('Optimizer Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
