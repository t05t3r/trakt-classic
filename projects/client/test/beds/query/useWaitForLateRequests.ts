import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { useWaitForQueriesIdle } from '$test/beds/query/useWaitForQueriesIdle.ts';

// Reads the test bed's QueryClient, so call it inside the render factory.
export function useWaitForLateRequests() {
  const waitForQueriesIdle = useWaitForQueriesIdle();

  return async (): Promise<void> => {
    // Outlasts query-core's deferred notify and any microtask after it, then lets a started request land.
    await waitNegativeClaim();
    await waitForQueriesIdle();
  };
}
