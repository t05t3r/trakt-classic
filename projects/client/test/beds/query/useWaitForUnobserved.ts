import { useQueryClient } from '$lib/features/query/_internal/queryClientContext.ts';
import type { QueryFilters } from '@tanstack/query-core';

// Reads the test bed's QueryClient, so call it inside the render factory.
export function useWaitForUnobserved() {
  const client = useQueryClient();

  return (filters?: QueryFilters): Promise<void> => {
    // A filter that matches nothing would read as unobserved and skip the wait.
    if (client.getQueryCache().findAll(filters).length === 0) {
      return Promise.reject(
        new Error(`No query matches ${JSON.stringify(filters)}`),
      );
    }

    const unobserved = Promise.withResolvers<void>();
    const check = () => {
      const queries = client.getQueryCache().findAll(filters);
      if (queries.every((query) => query.getObserversCount() === 0)) {
        unobserved.resolve();
      }
    };
    const unsubscribe = client.getQueryCache().subscribe((event) => {
      if (event.type === 'observerRemoved') check();
    });
    check();
    return unobserved.promise.finally(unsubscribe);
  };
}
