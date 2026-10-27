import { browser } from '$app/environment';
import {
  InvalidateAction,
  type InvalidateActionOptions,
} from '$lib/requests/models/InvalidateAction.ts';
import { useQueryClient } from '$lib/features/query/_internal/queryClientContext.ts';
import { setMarker } from '$lib/utils/date/marker.ts';
import { NOOP_FN } from '$lib/utils/NOOP_FN.ts';
import type { Query, QueryCache } from '@tanstack/query-core';
import {
  isSnapshotCurrent,
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

// A failure moves errorUpdateCount; status stays 'error' through the refetch that follows one.
function isSnapshotSettled(
  cache: QueryCache,
  { query, dataUpdateCount, errorUpdateCount }: UpdateCounts,
): boolean {
  if (cache.get(query.queryHash) !== query) return true;
  if (query.getObserversCount() === 0) return true;
  if (query.state.errorUpdateCount > errorUpdateCount) return true;

  return isSnapshotCurrent(query, dataUpdateCount);
}

export function useInvalidator() {
  const client = browser ? useQueryClient() : undefined;

  // invalidateQueries skips a refetch paused offline, and a later invalidation
  // replaces a paused one, so each wait ends with a fresh look at the cache.
  const settleRefetches = async (
    predicate: (query: Query) => boolean,
  ): Promise<void> => {
    const refetching = client?.getQueryCache().findAll({
      type: 'active',
      predicate: (query) =>
        predicate(query) && query.state.fetchStatus !== 'idle',
    }) ?? [];
    if (refetching.length === 0) return;

    await Promise.all(
      refetching.map((query) => query.promise?.catch(NOOP_FN)),
    );
    return settleRefetches(predicate);
  };

  // A Snapshot holds its pages while further ones load, so its wait ends on its own read.
  const settleSnapshots = (
    counts: ReadonlyArray<UpdateCounts>,
  ): Promise<void> => {
    const cache = client?.getQueryCache();
    if (cache === undefined || counts.length === 0) return Promise.resolve();

    const settled = Promise.withResolvers<void>();
    const check = () => {
      if (counts.every((entry) => isSnapshotSettled(cache, entry))) {
        settled.resolve();
      }
    };
    const unsubscribe = cache.subscribe(check);
    check();
    return settled.promise.finally(unsubscribe);
  };

  const invalidateAll = async (actions: InvalidateActionOptions[]) => {
    actions.forEach(setMarker);

    const hasAuth = actions.includes(InvalidateAction.Auth);

    if (hasAuth) {
      await client?.removeQueries();
    }

    const predicate = (query: Query) =>
      hasAuth || actions.some((action) => query.queryKey.includes(action));
    const snapshots = client?.getQueryCache().findAll({
      predicate: (query) => predicate(query) && isSnapshotRead(query),
    }).map(countsOf) ?? [];
    const isOther = (query: Query) =>
      predicate(query) && !snapshots.some((entry) => entry.query === query);

    await client?.invalidateQueries({ predicate });
    await Promise.all([settleRefetches(isOther), settleSnapshots(snapshots)]);
  };

  const invalidate = (action: InvalidateActionOptions) =>
    invalidateAll([action]);

  return {
    invalidate,
    invalidateAll,
  };
}
