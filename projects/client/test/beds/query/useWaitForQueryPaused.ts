import { useQueryClient } from '$lib/features/query/_internal/queryClientContext.ts';
import type { QueryFilters } from '@tanstack/query-core';

// Reads the test bed's QueryClient, so call it inside the render factory.
export function useWaitForQueryPaused() {
  const client = useQueryClient();

  return (filters?: QueryFilters): Promise<void> => {
    const paused = Promise.withResolvers<void>();
    const check = () => {
      const queries = client.getQueryCache().findAll({
        ...filters,
        fetchStatus: 'paused',
      });
      if (queries.length > 0) paused.resolve();
    };
    const unsubscribe = client.getQueryCache().subscribe(check);
    check();
    return paused.promise.finally(unsubscribe);
  };
}
