import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
import type { CreateInfiniteQueryOptions } from '$lib/features/query/QueryOptions.ts';
import type { Paginatable } from '$lib/requests/models/Paginatable.ts';
import { multicast } from '$lib/utils/store/multicast.ts';
import type {
  InfiniteData,
  InfiniteQueryObserverResult,
  Query,
  QueryKey,
} from '@tanstack/query-core';
import { distinctUntilChanged, map, type Observable, scan } from 'rxjs';
import {
  type Held,
  nextHeld,
  type WhileUnsettled,
} from './_internal/nextHeld.ts';
import { useQueryClient } from './_internal/queryClientContext.ts';
import { readStatus } from './_internal/readStatus.ts';
import { heldOf, keepHeld } from './_internal/snapshotHolds.ts';
import { useAllPagesInfiniteQuery } from './_internal/useAllPagesInfiniteQuery.ts';

export type SnapshotOptions<T, S> = {
  select: (entries: ReadonlyArray<T>) => S;
  whileUnsettled: WhileUnsettled;
};

type ReadParams<T, TError> = {
  query: Query | undefined;
  result: InfiniteQueryObserverResult<InfiniteData<Paginatable<T>>, TError>;
  whileUnsettled: WhileUnsettled;
};

function read<T, TError>(
  { query, result, whileUnsettled }: ReadParams<T, TError>,
): Held<T> | undefined {
  // An observer left on a removed Query emits data that is not this Query's.
  if (query === undefined || query.state.data !== result.data) return undefined;

  const held = nextHeld({
    held: heldOf<T>(query, whileUnsettled),
    query: result,
    count: query.state.dataUpdateCount,
    whileUnsettled,
  });
  keepHeld({ query, whileUnsettled, held });
  return held;
}

/**
 * Reads every page of an infinite query as one Snapshot, shared by every
 * subscriber of the call. While it is unsettled, 'hold' reads the last
 * settled entries any call took from the same Query, and 'unknown' reads
 * `undefined`.
 */
export function useSnapshot<
  T,
  S,
  TError extends Error = Error,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = number,
>(
  options: CreateInfiniteQueryOptions<
    Paginatable<T>,
    TError,
    InfiniteData<Paginatable<T>>,
    TQueryKey,
    TPageParam
  >,
  { select, whileUnsettled }: SnapshotOptions<T, S>,
): Observable<S | undefined> {
  const cache = useQueryClient().getQueryCache();

  return useAllPagesInfiniteQuery<
    T,
    TError,
    InfiniteData<Paginatable<T>>,
    TQueryKey,
    TPageParam
  >(options).pipe(
    map((result) =>
      read({
        query: cache.find({ queryKey: options.queryKey, exact: true }),
        result,
        whileUnsettled,
      })?.pages
    ),
    distinctUntilChanged(),
    map((entries) => entries === undefined ? undefined : select(entries)),
    multicast(),
  );
}

export type SnapshotStatusOptions<T, S> = {
  select: (entries: ReadonlyArray<T>) => S;
  isEmpty: (data: S) => boolean;
};

type SnapshotRead<T, S, TError> = {
  result: InfiniteQueryObserverResult<InfiniteData<Paginatable<T>>, TError>;
  entries: ReadonlyArray<T> | undefined;
  data?: S;
};

function selectOnce<T, S, TError>(select: (entries: ReadonlyArray<T>) => S) {
  return (
    previous: SnapshotRead<T, S, TError> | undefined,
    next: SnapshotRead<T, S, TError>,
  ): SnapshotRead<T, S, TError> => {
    if (next.entries === undefined) return next;
    if (next.entries === previous?.entries) {
      return { ...next, data: previous.data };
    }

    return { ...next, data: select(next.entries) };
  };
}

/**
 * Reads every page as a section's status, held while unsettled; a failed
 * next page reads as error over the pages that landed.
 */
export function useSnapshotStatus<
  T,
  S,
  TError extends Error = Error,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = number,
>(
  options: CreateInfiniteQueryOptions<
    Paginatable<T>,
    TError,
    InfiniteData<Paginatable<T>>,
    TQueryKey,
    TPageParam
  >,
  { select, isEmpty }: SnapshotStatusOptions<T, S>,
): Observable<SectionStatus<S>> {
  const cache = useQueryClient().getQueryCache();

  return useAllPagesInfiniteQuery<
    T,
    TError,
    InfiniteData<Paginatable<T>>,
    TQueryKey,
    TPageParam
  >(options).pipe(
    map((result) => ({
      result,
      entries: read({
        query: cache.find({ queryKey: options.queryKey, exact: true }),
        result,
        whileUnsettled: 'hold',
      })?.pages,
    })),
    // A fetch-state change keeps the entries, so select reruns only on new ones.
    scan<SnapshotRead<T, S, TError>, SnapshotRead<T, S, TError>, undefined>(
      selectOnce(select),
      undefined,
    ),
    map(({ result, data }) =>
      readStatus({
        data: result.isFetchNextPageError ? undefined : data,
        result,
        isEmpty,
      })
    ),
    multicast(),
  );
}
