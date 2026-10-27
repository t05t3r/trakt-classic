import type { Season } from '$lib/requests/models/Season.ts';
import { nearestNumber } from './nearestNumber.ts';
import { previousSeasonNumber } from './previousSeasonNumber.ts';
import { seasonsWithEpisodes } from './seasonsWithEpisodes.ts';

export type AdjacentSeasons = { previous?: number; next?: number };

// Classic steps back into regular seasons only, but on from the specials into season 1.
export function adjacentSeasons(
  { seasons, season }: { seasons: ReadonlyArray<Season>; season: number },
): AdjacentSeasons {
  const numbers = seasonsWithEpisodes(seasons).map(({ number }) => number);

  return {
    previous: previousSeasonNumber({ seasons, season }),
    next: nearestNumber({ numbers, current: season, side: 'above' }),
  };
}
