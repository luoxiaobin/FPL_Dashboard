import { chooseStartingEleven } from '@/server/scenarios/generator';
import type { ChipAdvice, PlayerProjection } from './types';

type ChipRecord = { event: number; name: string };

export function buildChipAdvice(
  squad: PlayerProjection[],
  gameweeks: number[],
  events: Array<{ id: number; deadline_time: string }>,
  history: ChipRecord[] | null,
  activeChip: string | null,
): ChipAdvice | undefined {
  if (!history || !gameweeks.length) return;
  const current = gameweeks[0];
  const first = current <= 19 ? 1 : 20;
  const last = first === 1 ? 19 : 38;
  const deadline = events.find(event => event.id === last)?.deadline_time ?? null;
  const used = new Set(history.filter(chip => chip.event >= first && chip.event <= last).map(chip => chip.name));

  const weeks = gameweeks.flatMap((gameweek, index) => {
    if (gameweek > last) return [];
    const score = (player: PlayerProjection) => player.expectedByGameweek[index] ?? 0;
    const starters = chooseStartingEleven(squad, score).sort((a, b) => score(b) - score(a));
    const starterIds = new Set(starters.map(player => player.id));
    const [captain, vice] = starters;
    const captainMissChance = score(captain) > 0 ? 1 - captain.startProbability : 1;
    return [{
      gameweek,
      bboost: squad.reduce((sum, player) => sum + (starterIds.has(player.id) ? 0 : score(player)), 0),
      '3xc': score(captain) + captainMissChance * score(vice),
    }];
  });
  const options = (['bboost', '3xc'] as const).map(chip => {
    const ranked = weeks.map(week => ({ gameweek: week.gameweek, points: Number(week[chip].toFixed(2)) }))
      .sort((a, b) => b.points - a.points || a.gameweek - b.gameweek);
    return {
      chip, used: used.has(chip), currentPoints: ranked.find(week => week.gameweek === current)!.points,
      best: ranked[0],
      later: ranked.find(week => week.gameweek !== current) ?? null,
    };
  });
  const recommendation = activeChip ? null : options
    .filter(option => !option.used && option.best.gameweek === current && option.currentPoints > 0)
    .sort((a, b) => (b.currentPoints - (b.later?.points ?? 0)) - (a.currentPoints - (a.later?.points ?? 0))
      || b.currentPoints - a.currentPoints)[0]?.chip ?? null;
  return { expiresGameweek: last, deadline, activeChip, options, recommendation, throughGameweek: weeks.at(-1)!.gameweek };
}
