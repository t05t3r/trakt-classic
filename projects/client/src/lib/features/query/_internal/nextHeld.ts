import type { Paginatable } from '$lib/requests/models/Paginatable.ts';
import type { InfiniteData } from '@tanstack/query-core';

export type PagedQuery<T> = {
  data?: InfiniteData<Paginatable<T>>;
  isPending: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  isError: boolean;
  isFetchNextPageError: boolean;
};

export type WhileUnsettled = 'hold' | 'unknown';

// The pages are kept with the data and the data update they came from, to tell a new read from a fetch-state change.
export type Held<T> = {
  data?: PagedQuery<T>['data'];
  pages: ReadonlyArray<T> | undefined;
  count: number;
  // A next page failed after these pages; kept with them, so every reader of the hold sees it.
  isFailed: boolean;
};

type NextHeldParams<T> = {
  held?: Held<T>;
  query: PagedQuery<T>;
  count: number;
  whileUnsettled: WhileUnsettled;
};

function isSettled<T>(query: PagedQuery<T>): boolean {
  return !query.isPending && !query.isFetchingNextPage && !query.hasNextPage;
}

type ReadPagesParams<T> = Omit<NextHeldParams<T>, 'whileUnsettled'> & {
  isFailed: boolean;
};

function notKnown<T>(count: number): Held<T> {
  return { pages: undefined, count, isFailed: false };
}

function readPages<T>(
  { held, query, count, isFailed }: ReadPagesParams<T>,
): Held<T> {
  if (held === undefined || held.data !== query.data) {
    const pages = query.data?.pages.flatMap((page) => page.entries) ?? [];
    return { data: query.data, pages, count, isFailed };
  }
  if (held.count === count && held.isFailed === isFailed) return held;

  return { ...held, count, isFailed };
}

export function nextHeld<T>(
  { held, query, count, whileUnsettled }: NextHeldParams<T>,
): Held<T> {
  if (query.data === undefined) return notKnown(count);
  // A caller asking for unknown reads only a clean settle, never a held, refetching or failed one.
  if (whileUnsettled === 'unknown') {
    return isSettled(query) && !query.isFetching && !query.isError
      ? readPages({ held, query, count, isFailed: false })
      : notKnown(count);
  }
  if (isSettled(query)) {
    return readPages({ held, query, count, isFailed: false });
  }
  // Growth past one page must not turn every known read back to unknown.
  if (!query.isFetchNextPageError) return held ?? notKnown(count);

  return readPages({ held, query, count, isFailed: true });
}
