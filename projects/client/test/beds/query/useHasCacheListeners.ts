import { useQueryClient } from '$lib/features/query/_internal/queryClientContext.ts';

// Reads the test bed's QueryClient, so call it inside the render factory.
export function useHasCacheListeners() {
  const cache = useQueryClient().getQueryCache();

  return (): boolean => cache.hasListeners();
}
