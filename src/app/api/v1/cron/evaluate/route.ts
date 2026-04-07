import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// To protect this route from arbitrary public triggers, Vercel cron uses a bearer token
// or we can use a custom secret in the header. For now, we'll allow it or check a secret.
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  try {
    // 1. Basic Authorization (Optional but recommended for Cron endpoints)
    if (CRON_SECRET) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
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

    // 3. Batch logs by Gameweek to limit API calls
    const logsByGameweek = new Map<number, any[]>();
    for (const log of pendingLogs) {
      if (!logsByGameweek.has(log.gameweek_id)) {
        logsByGameweek.set(log.gameweek_id, []);
      }
      logsByGameweek.get(log.gameweek_id)!.push(log);
    }

    let processedCount = 0;

    // 4. Check Gameweek Event Statuses
    const bootstrapRes = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      cache: 'no-store'
    });
    
    if (!bootstrapRes.ok) {
        throw new Error('Failed to fetch FPL bootstrap');
    }
    const bootstrap = await bootstrapRes.json();

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

      // Fetch live points for this fully finished gameweek
      const liveRes = await fetch(`https://fantasy.premierleague.com/api/event/${gw}/live/`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        cache: 'no-store'
      });

      if (!liveRes.ok) {
        console.error(`Failed to fetch live points for GW ${gw}`);
        continue;
      }

      const liveData = await liveRes.json();
      
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

  } catch (error: any) {
    console.error('Cron Evaluation Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
