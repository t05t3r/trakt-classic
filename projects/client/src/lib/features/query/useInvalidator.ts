import { browser } from '$app/environment';
import {
  InvalidateAction,
  type InvalidateActionOptions,
} from '$lib/requests/models/InvalidateAction.ts';
import { useQueryClient } from '$lib/features/query/_internal/queryClientContext.ts';
import { setMarker } from '$lib/utils/date/marker.ts';
import { NOOP_FN } from '$lib/utils/NOOP_FN.ts';
import type {
  Query,
  QueryCache,
  QueryClient,
  QueryKey,
} from '@tanstack/query-core';
import { trackReaderWait } from './_internal/readerWaits.ts';
import {
  isSnapshotCurrent,
  isSnapshotFailed,
  isSnapshotRead,
} from './_internal/snapshotHolds.ts';

type UpdateCounts = {
  query: Query;
  dataUpdateCount: number;
  errorUpdateCount: number;
};

function countsOf(query: Query): UpdateCounts {
  return {
    query,
    dataUpdateCount: query.state.dataUpdateCount,
    errorUpdateCount: query.state.errorUpdateCount,
  };
}

const hasLeftCache = (cache: QueryCache, query: Query) =>
  cache.get(query.queryHash) !== query;

// A failure moves errorUpdateCount; status stays 'error' through the refetch that follows one.
function isSnapshotSettled(
  cache: QueryCache,
  { query, dataUpdateCount, errorUpdateCount }: UpdateCounts,
): boolean {
  if (hasLeftCache(cache, query)) return true;
  if (query.getObserversCount() === 0) return true;
  if (query.state.errorUpdateCount > errorUpdateCount) return true;

  return isSnapshotCurrent(query, dataUpdateCount);
}

// A list grown past its cached pages moves its count on page 1 even when a further page fails.
function isReadSince({ query, dataUpdateCount }: UpdateCounts): boolean {
  if (!isSnapshotRead(query)) {
    return query.state.dataUpdateCount > dataUpdateCount;
  }

  return isSnapshotCurrent(query, dataUpdateCount) && !isSnapshotFailed(query);
}

// Checks again at every cache event, so the wait ends on the first one that meets it.
function waitUntil(cache: QueryCache, isMet: () => boolean): Promise<void> {
  const met = Promise.withResolvers<void>();
  const check = () => {
    if (isMet()) met.resolve();
  };
  const unsubscribe = cache.subscribe(check);
  check();
  return met.promise.finally(unsubscribe);
}

// Undefined once the reader has read or left the cache; otherwise a wait for its next read.
function toReaderWait(
  cache: QueryCache,
  readerCounts: UpdateCounts,
): (() => Promise<void>) | undefined {
  const isReaderDone = () =>
    hasLeftCache(cache, readerCounts.query) || isReadSince(readerCounts);
  if (isReaderDone()) return undefined;

  // Released on its own read, so a reader that read is not re-read while another waits.
  return () => {
    const release = trackReaderWait(cache, readerCounts.query);
    return waitUntil(cache, isReaderDone).finally(release);
  };
}

// invalidateQueries skips a refetch paused offline, and a later invalidation
// replaces a paused one, so each wait ends with a fresh look at the cache.
async function settleRefetches(
  cache: QueryCache,
  predicate: (query: Query) => boolean,
): Promise<void> {
  const refetching = cache.findAll({
    type: 'active',
    predicate: (query) =>
      predicate(query) && query.state.fetchStatus !== 'idle',
  });
  if (refetching.length === 0) return;

  await Promise.all(
    refetching.map((query) => query.promise?.catch(NOOP_FN)),
  );
  return settleRefetches(cache, predicate);
}

// A Snapshot holds its pages while further ones load, so its wait ends on its own read.
function settleSnapshots(
  cache: QueryCache,
  counts: ReadonlyArray<UpdateCounts>,
): Promise<void> {
  if (counts.length === 0) return Promise.resolve();

  return waitUntil(
    cache,
    () => counts.every((entry) => isSnapshotSettled(cache, entry)),
  );
}

type SettleParams = { client: QueryClient; query: Query; isReader: boolean };

// Its answer from before the write cleared the invalidation, so it is invalidated again once settled.
async function invalidateOnSettle(
  { client, query, isReader }: SettleParams,
): Promise<UpdateCounts> {
  await query.promise?.catch(NOOP_FN);
  const counts = countsOf(query);
  // Joining a read under way, so writes landing during one request read it again once.
  void client.invalidateQueries({
    predicate: (other) => other === query,
    refetchType: isReader ? 'all' : 'active',
  }, { cancelRefetch: false });
  return counts;
}

export function useInvalidator() {
  const client = browser ? useQueryClient() : undefined;

  // Resolves a wait for the readers' next reads when the refetch left one unread.
  const invalidateAll = async (
    actions: InvalidateActionOptions[],
    readers: ReadonlyArray<QueryKey> = [],
  ): Promise<(() => Promise<void>) | undefined> => {
    actions.forEach(setMarker);
    if (client === undefined) return undefined;

    const hasAuth = actions.includes(InvalidateAction.Auth);

    if (hasAuth) {
      await client.removeQueries();
    }

    const predicate = (query: Query) =>
      hasAuth || actions.some((action) => query.queryKey.includes(action));
    const cache = client.getQueryCache();
    const snapshots = cache.findAll({
      predicate: (query) => predicate(query) && isSnapshotRead(query),
    }).map(countsOf);
    const isOther = (query: Query) =>
      predicate(query) && !snapshots.some((entry) => entry.query === query);
    const readerQueries = readers
      .map((reader) => cache.find({ queryKey: reader, exact: true }))
      .filter((query) => query !== undefined);
    // invalidateQueries restarts a request on its way only for an active query holding data.
    const onTheirWay = cache.findAll({
      fetchStatus: 'fetching',
      predicate: (query) =>
        predicate(query) &&
        (!query.isActive() || query.state.data === undefined),
    });
    const isReader = (query: Query) => readerQueries.includes(query);
    const readerCounts = readerQueries
      .filter((query) => !onTheirWay.includes(query))
      .map(countsOf);

    const refetches = client.invalidateQueries({ predicate });
    // Only a reader's counts need its settle; settleRefetches already waits on an active one.
    onTheirWay
      .filter((query) => !isReader(query))
      .forEach((query) => {
        void invalidateOnSettle({ client, query, isReader: false });
      });
    const settles = Promise.all(
      onTheirWay
        .filter(isReader)
        .map((query) => invalidateOnSettle({ client, query, isReader: true })),
    );
    const [, settled] = await Promise.all([refetches, settles]);
    await Promise.all([
      settleRefetches(cache, isOther),
      settleSnapshots(cache, snapshots),
    ]);

    const waits = [...readerCounts, ...settled]
      .map((counts) => toReaderWait(cache, counts))
      .filter((wait) => wait !== undefined);
    if (waits.length === 0) return undefined;

    return async () => {
      await Promise.all(waits.map((wait) => wait()));
    };
  };

  const invalidate = async (action: InvalidateActionOptions): Promise<void> => {
    await invalidateAll([action]);
  };

  return {
    invalidate,
    invalidateAll,
  };
}
