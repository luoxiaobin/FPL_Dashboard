interface FinishedFixture {
  team_h: number;
  team_a: number;
  team_h_score: number;
  team_a_score: number;
  event: number;
}

/**
 * Builds a map of team ID → last-5-match form string (e.g. "WDWLW").
 * Accepts only fixtures that are already finished/provisional.
 */
export function buildClubFormMap(
  finishedFixtures: FinishedFixture[],
  teams: Array<{ id: number }>
): Map<number, string> {
  const clubFormMap = new Map<number, string>();

  teams.forEach((t) => {
    const recent = finishedFixtures
      .filter(f => f.team_h === t.id || f.team_a === t.id)
      .sort((a, b) => b.event - a.event)
      .slice(0, 5);

    const form = recent.map(f => {
      const isHome = f.team_h === t.id;
      const teamScore = isHome ? f.team_h_score : f.team_a_score;
      const oppScore = isHome ? f.team_a_score : f.team_h_score;
      if (teamScore > oppScore) return 'W';
      if (teamScore < oppScore) return 'L';
      return 'D';
    }).reverse().join('');

    clubFormMap.set(t.id, form);
  });

  return clubFormMap;
}
