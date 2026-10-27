import type { SortParam } from '$lib/features/view-params/stores/useSortParam.ts';
import type { Season } from '$lib/requests/models/Season.ts';
import { isKnownDate } from '$lib/utils/date/isKnownDate.ts';
import { SEASONS_SORT } from './SEASONS_SORT.ts';
import { sortByValue } from './sortByValue.ts';

export type SeasonsSort = SortParam<
  (typeof SEASONS_SORT)['sorts'][number]['by']
>;

type SortSeasonsParams = {
  items: ReadonlyArray<Season>;
  sort: SeasonsSort;
};

function toSortValue(season: Season, by: SeasonsSort['by']): number | null {
  if (by === 'rating') return season.rating ?? null;
  if (by === 'number') return season.number;
  if (!isKnownDate(season.airDate)) return null;

  return season.airDate.getTime();
}

export function sortSeasons(
  { items, sort }: SortSeasonsParams,
): ReadonlyArray<Season> {
  return sortByValue({ items, sort, valueOf: toSortValue });
}
