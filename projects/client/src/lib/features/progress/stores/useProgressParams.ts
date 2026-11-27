import {
  useWatchedFilter,
  type WatchedFilter,
} from '$lib/features/filters/stores/useWatchedFilter.ts';
import { toProgressFilters } from '$lib/features/progress/_internal/toProgressFilters.ts';
import {
  PROGRESS_SORTS,
  type ProgressSortBy,
  type ProgressView,
} from '$lib/features/progress/PROGRESS_SORTS.ts';
import type { ProgressFilters } from '$lib/features/progress/ProgressFilters.ts';
import { ITEM_ID } from '$lib/features/view-params/ITEM_ID.ts';
import { pushKeepingSearch } from '$lib/features/view-params/pushKeepingSearch.ts';
import {
  type PageParam,
  usePageParam,
} from '$lib/features/view-params/stores/usePageParam.ts';
import type {
  SortList,
  SortParam,
} from '$lib/features/view-params/stores/useSortParam.ts';
import { useViewParam } from '$lib/features/view-params/stores/useViewParam.ts';
import { flipDirection } from '$lib/utils/sort/flipDirection.ts';
import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';
import {
  combineLatest,
  distinctUntilChanged,
  firstValueFrom,
  map,
  type Observable,
} from 'rxjs';

export type ProgressParams = PageParam & {
  filters: Observable<ProgressFilters>;
  watched: Observable<WatchedFilter | null>;
  show: Observable<number | null>;
  setView(view: ProgressView): Promise<void>;
  selectSort(by: ProgressSortBy<ProgressView>): Promise<void>;
  reverseSort(): Promise<void>;
  setWatched(filter: WatchedFilter | null): Promise<void>;
  clearShow(): Promise<void>;
};

// Generic, so each view's arm gets back a sort of its own names; undefined is no change.
type SortChange = <K extends string>(
  sort: SortParam<K>,
  sorts: SortList<SortParam<K>>,
) => SortParam<K> | undefined;

const HIDE_COMPLETED = { param: 'hide_completed', value: 'true' };

const isSamePath = (a: ProgressFilters, b: ProgressFilters) =>
  UrlBuilder.progress(a) === UrlBuilder.progress(b);

function withSort(
  filters: ProgressFilters,
  change: SortChange,
): ProgressFilters | undefined {
  if (filters.view === 'dropped') {
    const sort = change(filters.sort, PROGRESS_SORTS.dropped);
    return sort && { view: filters.view, sort };
  }

  const sort = change(filters.sort, PROGRESS_SORTS.watched);
  return sort && { view: filters.view, sort };
}

export function useProgressParams(
  filters: Observable<string>,
): ProgressParams {
  const { page, replacePage, withPageDropped } = usePageParam();
  const watched = useWatchedFilter(HIDE_COMPLETED);
  const show = useViewParam({ show: ITEM_ID });
  const current = filters.pipe(
    map(toProgressFilters),
    distinctUntilChanged(isSamePath),
  );

  const pushSort = (change: SortChange) =>
    pushKeepingSearch(async () => {
      const next = withSort(await firstValueFrom(current), change);
      return next && UrlBuilder.progress(next);
    });

  // Hiding changes which rows each page holds; a fade changes none.
  const setWatched = async (filter: WatchedFilter | null) => {
    const isHiding = await firstValueFrom(watched.filter) === 'hide';
    const write = watched.set(filter);

    return isHiding === (filter === 'hide') ? write : withPageDropped(write);
  };

  return {
    filters: current,
    watched: watched.filter,
    // `show` filters the watched view only.
    show: combineLatest({ shown: current, values: show.values }).pipe(
      map(({ shown, values }) =>
        shown.view === 'watched' && values.show !== null
          ? Number(values.show)
          : null
      ),
      distinctUntilChanged(),
    ),
    setView: (view) =>
      pushKeepingSearch(UrlBuilder.progress({ view }), { show: null }),
    selectSort: (by) =>
      pushSort((_sort, sorts) => sorts.find((each) => each.by === by)),
    reverseSort: () =>
      pushSort(({ by, how }) => ({ by, how: flipDirection(how) })),
    setWatched,
    clearShow: () => withPageDropped(show.set({ show: null })),
    page,
    replacePage,
  };
}
