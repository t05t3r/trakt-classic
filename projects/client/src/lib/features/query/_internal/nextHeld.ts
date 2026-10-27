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

type ReadPagesParams<T> = Omit<NextHeldParams<T>, 'whileUnsettled'>;

function readPages<T>({ held, query, count }: ReadPagesParams<T>): Held<T> {
  if (held === undefined || held.data !== query.data) {
    const pages = query.data?.pages.flatMap((page) => page.entries) ?? [];
    return { data: query.data, pages, count };
  }
  if (held.count === count) return held;

  return { ...held, count };
}

export function nextHeld<T>(
  { held, query, count, whileUnsettled }: NextHeldParams<T>,
): Held<T> {
  if (query.data === undefined) return { pages: undefined, count };
  // A caller asking for unknown reads only a clean settle, never a held, refetching or failed one.
  if (whileUnsettled === 'unknown') {
    return isSettled(query) && !query.isFetching && !query.isError
      ? readPages({ held, query, count })
      : { pages: undefined, count };
  }
  if (isSettled(query)) return readPages({ held, query, count });
  // Growth past one page must not turn every known read back to unknown.
  if (!query.isFetchNextPageError) return held ?? { pages: undefined, count };

  return readPages({ held, query, count });
}
