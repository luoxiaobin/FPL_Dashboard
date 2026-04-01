import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const entryId = req.cookies.get('fpl_entry_id')?.value;
    if (!entryId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 1. Fetch Bootstrap (Global) and Picks (User)
    const [bootstrapRes, picksRes, fixturesRes] = await Promise.all([
      fetch('https://fantasy.premierleague.com/api/bootstrap-static/', { headers: { 'User-Agent': 'Mozilla/5.0' } }),
      fetch(`https://fantasy.premierleague.com/api/entry/${entryId}/event/1/picks/`, { headers: { 'User-Agent': 'Mozilla/5.0' } }), // Fallback GW1 if current not found
      fetch('https://fantasy.premierleague.com/api/fixtures/', { headers: { 'User-Agent': 'Mozilla/5.0' } })
    ]);

    const bootstrap = await bootstrapRes.json();
    const currentGWData = bootstrap.events.find((e: any) => e.is_current) || bootstrap.events[0];
    const currentGW = currentGWData.id;
    
    // Logic: If current GW is finished, target the next one for suggestions
    const targetGW = (currentGWData.finished && currentGW < 38) ? currentGW + 1 : currentGW;
    
    // Refetch picks for the GW we are looking at (if it's already active/finished)
    // For future GWs, use current squad picks as proxy
    const actualPicksRes = await fetch(`https://fantasy.premierleague.com/api/entry/${entryId}/event/${currentGW}/picks/`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const picksData = await actualPicksRes.json();
    const fixtures = await fixturesRes.json();

    const teamMap = new Map(bootstrap.teams.map((t: any) => [t.id, t]));
    const userSquadIds = new Set(picksData.picks.map((p: any) => p.element));
    
    // Map DGW/BGW Status for ALL teams for the targetGW
    const teamFixturesInTargetGW = new Map<number, any[]>();
    fixtures.forEach((f: any) => {
      if (f.event === targetGW) {
        if (!teamFixturesInTargetGW.has(f.team_h)) teamFixturesInTargetGW.set(f.team_h, []);
        if (!teamFixturesInTargetGW.has(f.team_a)) teamFixturesInTargetGW.set(f.team_a, []);
        teamFixturesInTargetGW.get(f.team_h)?.push({ opponent: f.team_a, difficulty: f.team_h_difficulty, home: true });
        teamFixturesInTargetGW.get(f.team_a)?.push({ opponent: f.team_h, difficulty: f.team_a_difficulty, home: false });
      }
    });

    // Determine the NEXT fixture for each team (for scoring)
    const teamNextFixture = new Map<number, any>();
    const sortedFixtures = [...fixtures].sort((a, b) => a.event - b.event);
    
    for (const f of sortedFixtures) {
      if (f.finished || f.event < targetGW) continue;
      
      if (!teamNextFixture.has(f.team_h)) {
        teamNextFixture.set(f.team_h, { opponent: f.team_a, difficulty: f.team_h_difficulty, home: true, gw: f.event });
      }
      if (!teamNextFixture.has(f.team_a)) {
        teamNextFixture.set(f.team_a, { opponent: f.team_h, difficulty: f.team_a_difficulty, home: false, gw: f.event });
      }
    }

    const calculateScore = (p: any) => {
      const ep = parseFloat(p.ep_this) || 0;
      const ict = parseFloat(p.ict_index) || 0;
      const form = parseFloat(p.form) || 0;
      const fix = teamNextFixture.get(p.team);
      const difficulty = fix ? fix.difficulty : 3;
      
      // Base score on Official Expected Points (EP)
      let score = (ep * 5.0) + (ict / 20.0) + (form * 0.5);

      // Positional Bonus / Penalty for Captaincy
      // MID (3) and FWD (4) are better captains than DEF (2)
      if (p.element_type === 2) score -= 3.0; // Penalty for Captaining a Defender
      if (p.element_type === 4) score += 2.0; // Forward bonus
      if (p.element_type === 3) score += 1.5; // Midfielder bonus
      
      return score;
    };

    // Calculate Club Form (Last 5 Results)
    const finishedFixtures = fixtures.filter((f: any) => f.finished || f.finished_provisional);
    const clubFormMap = new Map<number, string>();
    bootstrap.teams.forEach((t: any) => {
      const teamFix = finishedFixtures
        .filter((f: any) => f.team_h === t.id || f.team_a === t.id)
        .sort((a: any, b: any) => b.event - a.event)
        .slice(0, 5);

      const form = teamFix.map((f: any) => {
        const isHome = f.team_h === t.id;
        const teamScore = isHome ? f.team_h_score : f.team_a_score;
        const oppScore = isHome ? f.team_a_score : f.team_h_score;
        if (teamScore > oppScore) return 'W';
        if (teamScore < oppScore) return 'L';
        return 'D';
      }).reverse().join('');
      
      clubFormMap.set(t.id, form);
    });

    const allPlayers = bootstrap.elements.map((p: any) => {
      const score = calculateScore(p);
      const fix = teamNextFixture.get(p.team);
      const teamInfo = teamMap.get(p.team) as any;
      const oppInfo = teamMap.get(fix?.opponent) as any;
      
      let targetFixtures: any[] = [];
      let multiFixtures: any[] = [];
      
      try {
        targetFixtures = teamFixturesInTargetGW.get(p.team) || [];
        multiFixtures = targetFixtures.map(tf => {
          const oppTeam = teamMap.get(tf.opponent) as any;
          return {
            opponent: oppTeam?.short_name || 'UNK',
            difficulty: tf.difficulty || 3,
            home: tf.home ?? true
          };
        });
      } catch (e) {
        console.error(`Error mapping fixtures for player ${p.web_name}:`, e);
      }

      return {
        id: p.id,
        name: p.web_name || 'Unknown',
        team: teamInfo?.short_name || 'UNK',
        ict: (parseFloat(p.ict_index || 0) / 10).toFixed(1), 
        form: p.form || '0.0',
        fdr: fix?.difficulty || 3,
        opponent: oppInfo?.short_name || 'UNK',
        isHome: fix?.home ?? true,
        score: score || 0,
        inSquad: userSquadIds.has(p.id),
        photo: p.code ? String(p.code) : p.photo?.replace('.jpg', ''),
        teamCode: teamInfo?.code,
        clubForm: clubFormMap.get(p.team) || '',
        isDGW: targetFixtures.length > 1,
        isBGW: targetFixtures.length === 0,
        fixtures: multiFixtures
      };
    });

    const suggestions = allPlayers
      .filter((p: any) => p.inSquad)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 3);

    // Dynamic Confidence Normalization
    const topScore = suggestions[0]?.score || 1;
    
    const formattedSuggestions = suggestions.map((p: any, i: number) => {
      // Relative confidence compared to the #1 pick
      const confidence = Math.round((p.score / topScore) * 100);
      return {
        ...p,
        role: i === 0 ? 'Captain' : i === 1 ? 'Vice-Captain' : 'Alternative',
        confidence
      };
    });

    // Market Target (Overall best available, ignoring budget/subs for now)
    const transferCandidate = allPlayers
      .filter((p: any) => !p.inSquad)
      .sort((a: any, b: any) => b.score - a.score)[0];

    const targetConfidence = Math.round((transferCandidate?.score / topScore) * 100);

    return NextResponse.json({
      activeGW: currentGW,
      targetGW,
      suggestions: formattedSuggestions,
      transferTarget: {
        ...transferCandidate,
        role: 'Market Target',
        confidence: targetConfidence
      }
    });

  } catch (error) {
    console.error('Suggestions Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
