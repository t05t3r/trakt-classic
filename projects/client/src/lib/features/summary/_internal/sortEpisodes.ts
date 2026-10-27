import type { SortParam } from '$lib/features/view-params/stores/useSortParam.ts';
import type { EpisodeEntry } from '$lib/requests/models/EpisodeEntry.ts';
import { isKnownDate } from '$lib/utils/date/isKnownDate.ts';
import { EPISODES_SORT } from './EPISODES_SORT.ts';
import { sortByValue } from './sortByValue.ts';

export type EpisodesSort = SortParam<
  (typeof EPISODES_SORT)['sorts'][number]['by']
>;

type SortEpisodesParams = {
  items: ReadonlyArray<EpisodeEntry>;
  sort: EpisodesSort;
};

function toSortValue(
  episode: EpisodeEntry,
  by: EpisodesSort['by'],
): number | null {
  if (by === 'number') return episode.number;
  if (by === 'rating') return episode.rating ?? null;
  if (by === 'votes') return episode.votes ?? null;
  if (!isKnownDate(episode.airDate)) return null;

  return episode.airDate.getTime();
}

export function sortEpisodes(
  { items, sort }: SortEpisodesParams,
): ReadonlyArray<EpisodeEntry> {
  return sortByValue({ items, sort, valueOf: toSortValue });
}
