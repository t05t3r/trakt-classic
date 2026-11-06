import { useUser } from '$lib/features/auth/stores/useUser.ts';
import type { UserHistory } from '$lib/features/auth/stores/useCurrentUserHistory.ts';
import {
  isWatchedInHistory,
  type WatchedInHistoryTarget,
} from '$lib/features/media-actions/isWatchedInHistory.ts';
import type { PageQuery } from '$lib/features/paging/stores/usePagedItems.ts';
import { useInfiniteQuery } from '$lib/features/query/useQuery.ts';
import { LIST_PAGE_SIZE } from '$lib/utils/LIST_PAGE_SIZE.ts';
import { multicast } from '$lib/utils/store/multicast.ts';
import {
  combineLatest,
  distinctUntilChanged,
  map,
  type Observable,
  of,
} from 'rxjs';

export type WatchedPercentage = {
  watched: number;
  count: number;
  percentage: number;
};

type WatchedPercentageParams<TParams, TEntry> = {
  query: PageQuery<TParams, TEntry>;
  params: TParams;
  count: number;
  toTarget: (entry: TEntry) => WatchedInHistoryTarget;
};

type ReadingParams<TEntry> = {
  history: UserHistory | null;
  pages: ReadonlyArray<ReadonlyArray<TEntry> | undefined>;
  count: number;
  toTarget: (entry: TEntry) => WatchedInHistoryTarget;
};

function toReading<TEntry>(
  { history, pages, count, toTarget }: ReadingParams<TEntry>,
): WatchedPercentage | undefined {
  if (!history) return undefined;
  if (!pages.every((page) => page !== undefined)) return undefined;

  const watched =
    pages.flat().filter((entry) =>
      isWatchedInHistory({ target: toTarget(entry), history })
    ).length;

  return { watched, count, percentage: Math.floor(watched * 100 / count) };
}

export function useWatchedPercentage<TParams, TEntry>(
  { query, params, count, toTarget }: WatchedPercentageParams<TParams, TEntry>,
): Observable<WatchedPercentage | undefined> {
  // combineLatest over no pages would complete without a reading.
  if (count === 0) return of({ watched: 0, count: 0, percentage: 0 });

  const pages = Array.from(
    { length: Math.ceil(count / LIST_PAGE_SIZE) },
    (_, index) =>
      useInfiniteQuery(query({ ...params, page: index + 1 })).pipe(
        map((result) => result.data?.pages.at(0)?.entries),
      ),
  );

  return combineLatest([useUser().history, combineLatest(pages)]).pipe(
    map(([history, entries]) =>
      toReading({ history, pages: entries, count, toTarget })
    ),
    // The count is fixed for the store's life, so the watched count tells readings apart.
    distinctUntilChanged((previous, next) =>
      previous?.watched === next?.watched
    ),
    multicast(),
  );
}
