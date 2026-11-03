import type { CreateInfiniteQueryOptions } from '$lib/features/query/QueryOptions.ts';
import {
  type SnapshotOptions,
  useSnapshot,
} from '$lib/features/query/useSnapshot.ts';
import type { Paginatable } from '$lib/requests/models/Paginatable.ts';
import { useWaitForLateRequests } from '$test/beds/query/useWaitForLateRequests.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import type { InfiniteData, QueryKey } from '@tanstack/query-core';
import { Subscription } from 'rxjs';
import { onTestFinished } from 'vitest';

// Registers the unsubscribe first, so a call outside a test throws before it subscribes.
export async function renderSnapshot<
  T,
  S,
  TError extends Error = Error,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = number,
>(
  query: CreateInfiniteQueryOptions<
    Paginatable<T>,
    TError,
    InfiniteData<Paginatable<T>>,
    TQueryKey,
    TPageParam
  >,
  select: SnapshotOptions<T, S>['select'],
) {
  const subscription = new Subscription();
  onTestFinished(() => subscription.unsubscribe());

  const rendered = await renderStore(() => ({
    snapshot: useSnapshot(query, { select, whileUnsettled: 'hold' }),
    waitForLateRequests: useWaitForLateRequests(),
  }));
  subscription.add(rendered.snapshot.subscribe());

  return rendered;
}
