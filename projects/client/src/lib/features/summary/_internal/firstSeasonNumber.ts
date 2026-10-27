import type { Season } from '$lib/requests/models/Season.ts';
import { SPECIALS } from '$lib/utils/media/SPECIALS.ts';
import { lowest } from './lowest.ts';
import { seasonsWithEpisodes } from './seasonsWithEpisodes.ts';

export function firstSeasonNumber(
  seasons: ReadonlyArray<Season>,
): number | undefined {
  const withEpisodes = seasonsWithEpisodes(seasons).map(({ number }) => number);
  const regular = withEpisodes.filter((number) => number !== SPECIALS);

  return lowest(regular) ?? lowest(withEpisodes);
}
