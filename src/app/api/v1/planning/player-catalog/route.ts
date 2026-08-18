import { NextResponse } from 'next/server';
import { fetchFplJson } from '@/server/fpl/client';
import type { FplPositionCode } from '@/lib/fplSquadReview';

interface BootstrapPlayer {
  id: number;
  web_name: string;
  team: number;
  element_type: number;
}

interface BootstrapTeam {
  id: number;
  name: string;
}

interface BootstrapPayload {
  elements: BootstrapPlayer[];
  teams: BootstrapTeam[];
}

const positions: Record<number, FplPositionCode> = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' };

export async function GET() {
  const bootstrap = await fetchFplJson<BootstrapPayload>('/api/bootstrap-static/', { cacheSeconds: 300 });
  const teams = new Map(bootstrap.teams.map(team => [team.id, team.name]));
  const players = bootstrap.elements.map(player => ({
    id: player.id,
    name: player.web_name,
    teamId: player.team,
    teamName: teams.get(player.team) ?? 'Unknown club',
    position: positions[player.element_type],
  }));
  return NextResponse.json({ players }, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
  });
}
