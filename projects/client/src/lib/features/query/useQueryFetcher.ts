import { useQueryClient } from '$lib/features/query/_internal/queryClientContext.ts';
import type { CreateQueryOptions } from '$lib/features/query/QueryOptions.ts';

const FETCHER_ENTRY = 'fetcher';

export function useQueryFetcher() {
  const client = useQueryClient();

  const fetch = <TOutput, TError extends Error>(
    options: CreateQueryOptions<TOutput, TError>,
  ): Promise<TOutput> =>
    client.query({
      ...options,
      // An entry of its own: an observer's may hold a fetch that waits for reconnect.
      queryKey: [...options.queryKey, FETCHER_ENTRY],
      // Read afresh and kept nowhere, so a click acts on the server's value.
      staleTime: 0,
      gcTime: 0,
      // A one-off fetch awaited by a click must fail offline, not wait for reconnect.
      networkMode: 'always',
    });

  return { fetch };
}
