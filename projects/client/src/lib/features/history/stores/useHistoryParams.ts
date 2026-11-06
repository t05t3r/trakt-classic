import { toDateRangeQuery } from '$lib/features/history/_internal/toDateRangeQuery.ts';
import { toHistoryFilters } from '$lib/features/history/_internal/toHistoryFilters.ts';
import { toHistoryItem } from '$lib/features/history/_internal/toHistoryItem.ts';
import type {
  HistoryItem,
  HistoryItemType,
} from '$lib/features/history/HISTORY_ITEM_TYPES.ts';
import type { HistoryType } from '$lib/features/history/HISTORY_TYPES.ts';
import { pushKeepingSearch } from '$lib/features/view-params/pushKeepingSearch.ts';
import {
  type PageParam,
  usePageParam,
} from '$lib/features/view-params/stores/usePageParam.ts';
import { useViewParam } from '$lib/features/view-params/stores/useViewParam.ts';
import type { DateRangeDays } from '$lib/models/DateRangeDays.ts';
import type { DateRangeParams } from '$lib/requests/models/DateRangeParams.ts';
import { isPositiveIntegerText } from '$lib/utils/number/isPositiveIntegerText.ts';
import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';
import {
  combineLatest,
  distinctUntilChanged,
  map,
  type Observable,
} from 'rxjs';

export type HistoryTypeFilter = HistoryType | 'all';

export type HistoryParams = PageParam & {
  type: Observable<HistoryTypeFilter>;
  item: Observable<HistoryItem | null>;
  genres: Observable<string | null>;
  range: Observable<DateRangeParams>;
  setType(type: HistoryTypeFilter): Promise<void>;
  setRange(days: DateRangeDays): Promise<void>;
  clearRange(): Promise<void>;
  clearItem(): Promise<void>;
};

const GENRE_SLUG = /^[a-z0-9-]+$/;

const isGenreSlug = (value: string) => GENRE_SLUG.test(value);

const ANY_VALUE = { values: () => true, fallback: null };

// Trakt's ids start at 1, and a read takes an id of 0 as no id.
const ITEM_ID = {
  values: isPositiveIntegerText,
  fallback: null,
};

const NO_ITEM = { movie: null, episode: null, show: null, season: null };

const TYPE_OF_ITEM: Record<HistoryItemType, HistoryType> = {
  movie: 'movies',
  episode: 'episodes',
  show: 'episodes',
  season: 'episodes',
};

// `YYYY-MM-DD` days sort as strings; an open end has nothing to swap with.
const toRangeWrite = ({ start, end }: DateRangeDays) =>
  start && end && start > end
    ? { start_at: end, end_at: start, days: null }
    : { start_at: start || null, end_at: end || null, days: null };

export function useHistoryParams(filters: Observable<string>): HistoryParams {
  const { page, replacePage, withPageDropped } = usePageParam();
  const genres = useViewParam({
    genres: { values: isGenreSlug, fallback: null },
  });
  // Its distinct check on the raw strings keeps a page change from making new Dates.
  const range = useViewParam({
    start_at: ANY_VALUE,
    end_at: ANY_VALUE,
    days: ANY_VALUE,
  });

  const itemIds = useViewParam({
    movie: ITEM_ID,
    episode: ITEM_ID,
    show: ITEM_ID,
    season: ITEM_ID,
  });
  const item = itemIds.values.pipe(map(toHistoryItem));

  const setRange = (days: DateRangeDays) =>
    withPageDropped(range.set(toRangeWrite(days)));

  return {
    // The item decides, so the toolbar and the read agree whatever the path says.
    type: combineLatest({ value: filters, item }).pipe(
      map(({ value, item }) =>
        item ? TYPE_OF_ITEM[item.type] : toHistoryFilters(value).type
      ),
      distinctUntilChanged(),
    ),
    item,
    genres: genres.values.pipe(map((values) => values.genres)),
    range: range.values.pipe(map(toDateRangeQuery)),
    page,
    setType: (type) =>
      pushKeepingSearch(
        type === 'all'
          ? UrlBuilder.history.home()
          : UrlBuilder.history.home(type),
        NO_ITEM,
      ),
    setRange,
    clearRange: () => setRange({ start: '', end: '' }),
    clearItem: () => withPageDropped(itemIds.set(NO_ITEM)),
    replacePage,
  };
}
