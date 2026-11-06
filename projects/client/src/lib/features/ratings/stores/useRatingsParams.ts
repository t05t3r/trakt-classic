import {
  useWatchedFilter,
  type WatchedFilter,
} from '$lib/features/filters/stores/useWatchedFilter.ts';
import type { RatingFilter } from '$lib/features/media-actions/RATING_VALUES.ts';
import { toRatingsFilters } from '$lib/features/ratings/_internal/toRatingsFilters.ts';
import type { RatingsTypeFilter } from '$lib/features/ratings/RATINGS_TYPES.ts';
import { pushKeepingSearch } from '$lib/features/view-params/pushKeepingSearch.ts';
import {
  type PageParam,
  usePageParam,
} from '$lib/features/view-params/stores/usePageParam.ts';
import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';
import {
  distinctUntilChanged,
  firstValueFrom,
  map,
  type Observable,
} from 'rxjs';

export type RatingsParams = PageParam & {
  type: Observable<RatingsTypeFilter>;
  rating: Observable<RatingFilter>;
  watched: Observable<WatchedFilter | null>;
  setType(type: RatingsTypeFilter): Promise<void>;
  setRating(rating: RatingFilter): Promise<void>;
  setWatched(filter: WatchedFilter | null): Promise<void>;
};

export function useRatingsParams(filters: Observable<string>): RatingsParams {
  const { page, replacePage } = usePageParam();
  const watched = useWatchedFilter();
  const slots = filters.pipe(map(toRatingsFilters));

  const pushSlot = async (
    slot: { type: RatingsTypeFilter } | { rating: RatingFilter },
  ) =>
    pushKeepingSearch(
      UrlBuilder.ratings({ ...await firstValueFrom(slots), ...slot }),
    );

  return {
    type: slots.pipe(map(({ type }) => type), distinctUntilChanged()),
    rating: slots.pipe(map(({ rating }) => rating), distinctUntilChanged()),
    watched: watched.filter,
    page,
    setType: (type) => pushSlot({ type }),
    setRating: (rating) => pushSlot({ rating }),
    setWatched: watched.set,
    replacePage,
  };
}
