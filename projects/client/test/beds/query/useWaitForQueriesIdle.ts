import { useQueryClient } from '$lib/features/query/_internal/queryClientContext.ts';
import type { QueryFilters } from '@tanstack/query-core';

// Reads the test bed's QueryClient, so call it inside the render factory.
export function useWaitForQueriesIdle() {
  const client = useQueryClient();

  return (filters?: QueryFilters): Promise<void> => {
    const idle = Promise.withResolvers<void>();
    const check = () => {
      if (client.isFetching(filters) === 0) idle.resolve();
    };
    const unsubscribe = client.getQueryCache().subscribe(check);
    check();
    return idle.promise.finally(unsubscribe);
  };
}
