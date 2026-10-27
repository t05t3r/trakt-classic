import type { Season } from '$lib/requests/models/Season.ts';
import { SPECIALS } from '$lib/utils/media/SPECIALS.ts';
import { nearestNumber } from './nearestNumber.ts';
import { seasonsWithEpisodes } from './seasonsWithEpisodes.ts';

export function previousSeasonNumber(
  { seasons, season }: { seasons: ReadonlyArray<Season>; season: number },
): number | undefined {
  const regular = seasonsWithEpisodes(seasons)
    .map(({ number }) => number)
    .filter((number) => number !== SPECIALS);

  return nearestNumber({ numbers: regular, current: season, side: 'below' });
}
