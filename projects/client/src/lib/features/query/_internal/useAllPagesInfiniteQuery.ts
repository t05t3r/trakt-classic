import type { CreateInfiniteQueryOptions } from '$lib/features/query/QueryOptions.ts';
import { rethrowUnlessCancelled } from '$lib/features/query/rethrowUnlessCancelled.ts';
import { useInfiniteQuery } from '$lib/features/query/useQuery.ts';
import type { Paginatable } from '$lib/requests/models/Paginatable.ts';
import type {
  InfiniteData,
  InfiniteQueryObserverResult,
  QueryKey,
} from '@tanstack/query-core';
import { type Observable, tap } from 'rxjs';
import { useQueryClient } from './queryClientContext.ts';

/**
 * Like `useInfiniteQuery`, but automatically fetches subsequent pages until
 * all data is loaded. Uses live QueryClient state to guard `fetchNextPage()`
 * so that several observers of one Query (each `ListMenu`'s lists, each
 * `ListMembershipRow` of one list, an observer kept through its multicast
 * grace window) don't duplicate in-flight fetches.
 */
export function useAllPagesInfiniteQuery<
  TOutput,
  TError extends Error,
  TData = InfiniteData<Paginatable<TOutput>>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = number,
>(
  props: CreateInfiniteQueryOptions<
    Paginatable<TOutput>,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
): Observable<InfiniteQueryObserverResult<TData, TError>> {
  const client = useQueryClient();

  return useInfiniteQuery<TOutput, TError, TData, TQueryKey, TPageParam>(
    props,
  ).pipe(
    tap((query) => {
      // A failed next page would otherwise be requested again on every emission.
      if (
        query.hasNextPage &&
        !query.isFetchNextPageError &&
        client.getQueryState(props.queryKey)?.fetchStatus === 'idle'
      ) {
        query.fetchNextPage().catch(rethrowUnlessCancelled);
      }
    }),
  );
}
