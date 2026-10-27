import { useQueryClient } from '$lib/features/query/_internal/queryClientContext.ts';
import type { QueryFilters } from '@tanstack/query-core';

// Reads the test bed's QueryClient, so call it inside the render factory.
export function useWaitForQueryFetching() {
  const client = useQueryClient();

  return (filters?: QueryFilters): Promise<void> => {
    const fetching = Promise.withResolvers<void>();
    const check = () => {
      const queries = client.getQueryCache().findAll({
        ...filters,
        fetchStatus: 'fetching',
      });
      if (queries.length > 0) fetching.resolve();
    };
    const unsubscribe = client.getQueryCache().subscribe(check);
    check();
    return fetching.promise.finally(unsubscribe);
  };
}
