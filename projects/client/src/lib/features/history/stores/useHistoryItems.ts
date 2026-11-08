import type { ShowPlays } from '$lib/features/history/_internal/groupPlaysByShow.ts';
import { useShowCards } from '$lib/features/history/_internal/useShowCards.ts';
import type { HistoryItem } from '$lib/features/history/HISTORY_ITEM_TYPES.ts';
import type { HistoryTypeFilter } from '$lib/features/history/stores/useHistoryParams.ts';
import {
  type ListItemCard,
  toListItemCard,
} from '$lib/features/media-card/toListItemCard.ts';
import { toListItemCover } from '$lib/features/media-card/toListItemCover.ts';
import {
  type PagedReading,
  type PagedRow,
  usePagedItems,
} from '$lib/features/paging/stores/usePagedItems.ts';
import type { DateRangeParams } from '$lib/requests/models/DateRangeParams.ts';
import {
  type ActivityHistory,
  activityHistoryQuery,
} from '$lib/requests/queries/users/activityHistoryQuery.ts';
import { episodeActivityHistoryQuery } from '$lib/requests/queries/users/episodeActivityHistoryQuery.ts';
import { movieActivityHistoryQuery } from '$lib/requests/queries/users/movieActivityHistoryQuery.ts';
import { showActivityHistoryQuery } from '$lib/requests/queries/users/showActivityHistoryQuery.ts';
import { HISTORY_PAGE_SIZE } from '$lib/utils/HISTORY_PAGE_SIZE.ts';
import type { Observable } from 'rxjs';

export type HistoryItemsValues = Readonly<{
  type: HistoryTypeFilter;
  item: HistoryItem | null;
  genres: string | null;
  range: DateRangeParams;
  page: number;
}>;

export type HistoryEntry = ActivityHistory | ShowPlays;

export type HistoryRow = PagedRow<HistoryEntry, ListItemCard>;

export type HistoryReading = PagedReading<HistoryEntry, ListItemCard>;

type UseHistoryItemsParams = {
  values: HistoryItemsValues;
  replacePage: (page: number) => void;
};

export function useHistoryItems(
  { values: { type, item, genres, range, page }, replacePage }:
    UseHistoryItemsParams,
): Observable<HistoryReading> {
  const params = {
    slug: 'me',
    limit: HISTORY_PAGE_SIZE,
    // A title's routes take no genres.
    filter: item || genres === null ? undefined : { genres },
    ...range,
  };
  const read = {
    params,
    page,
    pageSize: HISTORY_PAGE_SIZE,
    toCard: toListItemCard,
    toCover: toListItemCover,
    replacePage,
  };

  switch (item?.type) {
    case 'movie':
      return usePagedItems({
        ...read,
        params: { ...params, id: item.id },
        query: movieActivityHistoryQuery,
      });
    case 'episode':
      return usePagedItems({
        ...read,
        params: { ...params, id: item.id },
        query: episodeActivityHistoryQuery,
      });
    case 'show':
      return usePagedItems({
        ...read,
        params: { ...params, id: item.id },
        query: showActivityHistoryQuery,
      });
    case 'season':
      return usePagedItems({
        ...read,
        params: { ...params, seasonId: item.id },
        query: activityHistoryQuery,
      });
  }

  switch (type) {
    case 'all':
      return usePagedItems({ ...read, query: activityHistoryQuery });
    case 'movies':
      return usePagedItems({ ...read, query: movieActivityHistoryQuery });
    case 'shows':
      return useShowCards({ params, page, replacePage });
    case 'episodes':
      return usePagedItems({ ...read, query: showActivityHistoryQuery });
  }
}
