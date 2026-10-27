import type { CreateQueryOptions } from '$lib/features/query/QueryOptions.ts';
import { useQuery } from '$lib/features/query/useQuery.ts';
import type { QueryObserverResult } from '@tanstack/query-core';
import { filter, map, type Observable, tap } from 'rxjs';

export type Tagged<R, T> = { read: R; result: QueryObserverResult<T> };

// Each result carries the read its query answers: the bridge emits the new options' result in the tap's call,
// or nothing when a pending result does not change, which keeps the previous read and so reads loading.
export function useTaggedQuery<R, T>(
  read$: Observable<R>,
  toQuery: (read: R) => CreateQueryOptions<T, Error>,
): Observable<Tagged<R, T>> {
  const tag: { current?: { read: R } } = {};
  const options = read$.pipe(
    tap((read) => {
      tag.current = { read };
    }),
    map(toQuery),
  );

  return useQuery(options).pipe(
    map((result) => tag.current && { read: tag.current.read, result }),
    filter((tagged) => tagged !== undefined),
  );
}
