import type { Season } from '$lib/requests/models/Season.ts';

export function seasonsWithEpisodes(
  seasons: ReadonlyArray<Season>,
): ReadonlyArray<Season> {
  return seasons.filter(({ episodes }) => episodes.count > 0);
}
