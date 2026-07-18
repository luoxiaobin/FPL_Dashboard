import { NextResponse } from 'next/server';
import { FplApiError, getBootstrap, getLiveEvent } from '@/lib/fpl/client';
import { seasonCodeFromEvents } from '@/lib/fpl/gameweekContext';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    // Require CRON_SECRET unconditionally — endpoint must not be open without it
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      console.error('CRON_SECRET environment variable is not configured');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch all Pending Recommendations
    const { data: pendingLogs, error: fetchError } = await supabaseAdmin
      .from('recommendation_logs')
      .select('*')
      .eq('outcome', 'Pending');

    if (fetchError) {
      console.error('Failed to fetch pending logs:', fetchError);
      return NextResponse.json({ error: 'Database fetch failed' }, { status: 500 });
    }

    if (!pendingLogs || pendingLogs.length === 0) {
      return NextResponse.json({ message: 'No pending recommendations found', processed: 0 });
    }

    const bootstrap = await getBootstrap();
    const seasonCode = seasonCodeFromEvents(bootstrap.events);
    const { data: activeSeason } = await supabaseAdmin
      .from('seasons').select('id').eq('code', seasonCode).maybeSingle();
    const logsForEvaluation = activeSeason
      ? pendingLogs.filter((log: any) => !log.season_id || log.season_id === activeSeason.id)
      : pendingLogs;
    // 3. Batch logs by Gameweek to limit API calls
    const logsByGameweek = new Map<number, any[]>();
    for (const log of logsForEvaluation) {
      if (!logsByGameweek.has(log.gameweek_id)) {
        logsByGameweek.set(log.gameweek_id, []);
      }
      logsByGameweek.get(log.gameweek_id)!.push(log);
    }

    let processedCount = 0;

    // 4. Check Gameweek Event Statuses

    const updatesToApply: any[] = [];

    // 5. Evaluate Gameweeks sequentially
    for (const [gw, logs] of logsByGameweek.entries()) {
      // Find the event in bootstrap
      const eventMeta = bootstrap.events.find((e: any) => e.id === gw);
      
      // We only evaluate if the gameweek is officially structurally finished
      if (!eventMeta || !eventMeta.finished || !eventMeta.data_checked) {
        console.log(`Gameweek ${gw} is not yet finalized. Skipping ${logs.length} logs.`);
        continue; // Skip this gameweek, evaluate next time
      }

      // Fetch live points through the shared client.
      let liveData: { elements?: Array<{ id: number; stats: { total_points?: number } }> };
      try {
        liveData = await getLiveEvent<{ elements?: Array<{ id: number; stats: { total_points?: number } }> }>(gw);
      } catch (error) {
        if (error instanceof FplApiError) console.error('Failed to fetch live points:', error.code);
        continue;
      }
      
      // Create a fast lookup map for points: element_id -> total_points
      const pointsMap = new Map<number, number>();
      if (liveData.elements) {
          liveData.elements.forEach((el: any) => {
              pointsMap.set(el.id, el.stats.total_points || 0);
          });
      }

      // 6. Evaluate each log
      for (const log of logs) {
        const outPoints = pointsMap.get(log.out_player_id) ?? 0;
        const inPoints = pointsMap.get(log.in_player_id) ?? 0;

        let outcome = 'Neutral';
        if (inPoints > outPoints) outcome = 'Hit';
        if (inPoints < outPoints) outcome = 'Miss';

        updatesToApply.push({
          id: log.id,
          user_id: log.user_id, // include required fields if your schema requires it for update
          gameweek_id: log.gameweek_id,
          out_player_id: log.out_player_id,
          in_player_id: log.in_player_id,
          expected_gain: log.expected_gain,
          rationale: log.rationale,
          outcome: outcome
        });
      }
    }

    // 7. Perform Bulk Upsert or individual updates
    if (updatesToApply.length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('recommendation_logs')
        .upsert(updatesToApply, { onConflict: 'id' });

      if (updateError) {
        console.error('Failed to update recommendation logs:', updateError);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }
      processedCount = updatesToApply.length;
    }

    return NextResponse.json({ 
        message: 'Evaluation completed successfully', 
        processed: processedCount 
    });

  } catch (error: unknown) {
    console.error('Cron Evaluation Error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
