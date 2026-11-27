import type { Query, QueryCache, QueryClient } from '@tanstack/query-core';

// One token per wait, so two waits on one reader release apart.
type ReaderWait = { query: Query };

const WAITS = new WeakMap<QueryCache, Set<ReaderWait>>();

export function trackReaderWait(cache: QueryCache, query: Query): () => void {
  const waits = WAITS.get(cache) ?? new Set<ReaderWait>();
  const wait = { query };
  waits.add(wait);
  WAITS.set(cache, waits);

  return () => {
    waits.delete(wait);
  };
}

export function rereadWaitingReaders(client: QueryClient): Promise<void> {
  const waits = [...WAITS.get(client.getQueryCache()) ?? []];
  if (waits.length === 0) return Promise.resolve();

  // false joins a read under way instead of cancelling and resending it.
  return client.refetchQueries({
    type: 'all',
    stale: true,
    predicate: (query) => waits.some((wait) => wait.query === query),
  }, { cancelRefetch: false });
}
