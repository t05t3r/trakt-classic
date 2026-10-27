import { SPECIALS } from '$lib/utils/media/SPECIALS.ts';

export function countWatchedEpisodes(
  playsPerSeason: ReadonlyMap<number, number>,
): number {
  return [...playsPerSeason.entries()]
    .filter(([season]) => season !== SPECIALS)
    .reduce((sum, [, count]) => sum + count, 0);
}
