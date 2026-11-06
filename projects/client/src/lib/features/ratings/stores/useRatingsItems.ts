import type { WatchedFilter } from '$lib/features/filters/stores/useWatchedFilter.ts';
import type { RatingFilter } from '$lib/features/media-actions/RATING_VALUES.ts';
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
import type { RatingsTypeFilter } from '$lib/features/ratings/RATINGS_TYPES.ts';
import {
  type UserRatingEntry,
  userRatingsQuery,
} from '$lib/requests/queries/users/userRatingsQuery.ts';
import { HISTORY_PAGE_SIZE } from '$lib/utils/HISTORY_PAGE_SIZE.ts';
import type { Observable } from 'rxjs';

export type RatingsItemsValues = Readonly<{
  type: RatingsTypeFilter;
  rating: RatingFilter;
  page: number;
}>;

export type RatingRow = PagedRow<UserRatingEntry, ListItemCard>;

export type RatingsReading = PagedReading<UserRatingEntry, ListItemCard>;

type UseRatingsItemsParams = {
  values: RatingsItemsValues;
  watched: Observable<WatchedFilter | null>;
  replacePage: (page: number) => void;
};

export function useRatingsItems(
  { values: { type, rating, page }, watched, replacePage }:
    UseRatingsItemsParams,
): Observable<RatingsReading> {
  return usePagedItems({
    query: userRatingsQuery,
    params: { slug: 'me', type, rating, limit: HISTORY_PAGE_SIZE },
    page,
    pageSize: HISTORY_PAGE_SIZE,
    toCard: toListItemCard,
    toCover: toListItemCover,
    watched,
    replacePage,
  });
}
