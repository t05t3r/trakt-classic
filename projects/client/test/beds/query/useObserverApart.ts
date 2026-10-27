import type { CreateQueryOptions } from '$lib/features/query/QueryOptions.ts';
import { useInvalidator } from '$lib/features/query/useInvalidator.ts';
import { useQuery } from '$lib/features/query/useQuery.ts';
import { useWaitForQueriesIdle } from '$test/beds/query/useWaitForQueriesIdle.ts';
import { useWaitForQueryPaused } from '$test/beds/query/useWaitForQueryPaused.ts';
import { onTestFinished } from 'vitest';

// Reads the test bed's QueryClient, so call it inside the render factory;
// `observe` subscribes apart, so a test can start the observer's read offline.
export function useObserverApart<TOutput, TError extends Error>(
  options: CreateQueryOptions<TOutput, TError>,
) {
  const query = useQuery(options);
  const observe = () => {
    const subscription = query.subscribe();
    onTestFinished(() => subscription.unsubscribe());
  };

  return {
    observe,
    waitForQueryPaused: useWaitForQueryPaused(),
    waitForQueriesIdle: useWaitForQueriesIdle(),
    invalidate: useInvalidator().invalidate,
  };
}
