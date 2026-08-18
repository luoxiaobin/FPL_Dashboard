import type { Page, Route } from '@playwright/test';

type DashboardStatus = 'live' | 'provisional' | 'official';

interface DashboardFixtureOptions {
  summaryFailure?: boolean;
  status?: DashboardStatus;
  fixtureTicker?: boolean;
}

const names = [
  'Player One', 'Player Two', 'Player Three', 'Player Four', 'Player Five',
  'Player Six', 'Player Seven', 'Player Eight', 'Player Nine', 'Player Ten',
  'Player Eleven', 'Bench Keeper', 'Bench Defender', 'Bench Midfielder', 'Bench Forward',
];

const positions = [
  'GKP', 'DEF', 'DEF', 'DEF', 'DEF',
  'MID', 'MID', 'MID', 'MID', 'FWD', 'FWD',
  'GKP', 'DEF', 'MID', 'FWD',
];

const points = [0, 5, 4, 3, 2, 8, 7, 6, 5, 9, 4, 0, 4, 2, 1];

export const controlledSquad = names.map((name, index) => ({
  id: index + 1,
  name,
  position: positions[index],
  official_pos: index + 1,
  multiplier: index === 0 ? 2 : 1,
  live_points: points[index],
  bps: index === 5 ? 24 : 0,
  bonus: index === 5 ? 2 : 0,
  is_captain: index === 0,
  is_vice_captain: index === 5,
  minutes: index === 0 || index === 4 || index === 11 ? 0 : 90,
  price: Number((4.5 + index * 0.2).toFixed(1)),
  is_finished: index === 4 || index === 11,
  was_started: index < 11,
  photo: String(1000 + index),
  teamCode: 10 + (index % 5),
  clubForm: 'WWDLW',
}));

const fixturePlayers = controlledSquad.map((player, index) => ({
  id: player.id,
  name: player.name,
  photo: player.photo,
  teamCode: player.teamCode,
  club: `Club ${index + 1}`,
  clubForm: 'WWDLW',
  teamShort: `C${index + 1}`,
  teamForm: '4.2',
  role: player.position,
  status: null,
  chance: 100,
  position: player.official_pos,
  fixtures: index === 5
    ? [
        { gw: 7, opponent: 'AAA', difficulty: 2, home: true, isDGW: true },
        { gw: 7, opponent: 'BBB', difficulty: 4, home: false, isDGW: true },
        { gw: 9, opponent: 'CCC', difficulty: 3, home: true },
      ]
    : [
        { gw: 7, opponent: 'DDD', difficulty: 3, home: index % 2 === 0 },
        { gw: 8, opponent: 'EEE', difficulty: 2, home: index % 2 !== 0 },
        { gw: 9, opponent: 'FFF', difficulty: 4, home: true },
        { gw: 10, opponent: 'GGG', difficulty: 3, home: false },
        { gw: 11, opponent: 'HHH', difficulty: 2, home: true },
      ],
}));

const allSections = (fixtureTicker: boolean) => ({
  captaincyAdviser: false,
  rankProjection: false,
  historyChart: false,
  gameweekHistory: false,
  fixtureTicker,
  transferAnalyser: false,
  transferOptimizer: false,
  squadPitch: true,
  livePoints: true,
  leagueStandings: false,
});

const fulfillJson = (route: Route, body: unknown, status = 200) => route.fulfill({
  status,
  contentType: 'application/json',
  body: JSON.stringify(body),
});

export async function installDashboardFixture(
  page: Page,
  options: DashboardFixtureOptions = {},
): Promise<void> {
  const status = options.status ?? 'live';

  await page.route('**/api/v1/**', async route => {
    const url = new URL(route.request().url());

    if (url.pathname === '/api/v1/user/summary') {
      if (options.summaryFailure) {
        await fulfillJson(route, { error: 'Controlled summary failure' }, 503);
        return;
      }
      await fulfillJson(route, {
        user_id: 424242,
        manager_name: 'Ada Manager',
        team_name: 'Controlled United',
        overall_rank: 12345,
        total_points: 456,
        total_players: 10000000,
        bank_balance: 1.7,
        total_value: 101.3,
        available_chips: ['wildcard', 'freehit'],
        trend: 'Improving',
        transfers_available: 2,
        current_event_status: status === 'live' ? 'live' : 'planning',
      });
      return;
    }

    if (url.pathname === '/api/v1/squad/live') {
      await fulfillJson(route, {
        gameweek: 7,
        status,
        players: controlledSquad,
        projected_points: 55,
      });
      return;
    }

    if (url.pathname === '/api/v1/user/preferences') {
      await fulfillJson(route, { preferences: allSections(Boolean(options.fixtureTicker)) });
      return;
    }

    if (url.pathname === '/api/v1/fixtures') {
      await fulfillJson(route, { gameweek: 7, nextGWs: [7, 8, 9, 10, 11], players: fixturePlayers });
      return;
    }

    if (url.pathname === '/api/v1/sync') {
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: 'data: {"step":"complete","message":"Controlled sync complete"}\n\n',
      });
      return;
    }

    const emptyResponses: Record<string, unknown> = {
      '/api/v1/squad/suggestions': { suggestions: [] },
      '/api/v1/squad/optimize': { suggestions: [] },
      '/api/v1/user/transfers': { transfers: [] },
      '/api/v1/user/history': { current: [], chips: [] },
      '/api/v1/leagues': { leagues: [] },
      '/api/v1/rank-projection': { status: 'no_active_gw', message: 'Controlled fixture' },
    };

    await fulfillJson(route, emptyResponses[url.pathname] ?? {});
  });
}
