import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
import type { QueryObserverResult } from '@tanstack/query-core';

type ReadStatusParams<U> = {
  data: U | undefined;
  result: Pick<QueryObserverResult<unknown>, 'status' | 'refetch'>;
  isEmpty: (data: U) => boolean;
};

export function readStatus<U>(
  { data, result, isEmpty }: ReadStatusParams<U>,
): SectionStatus<U> {
  // A failed refetch keeps the data it had, so the data wins over the error.
  if (data !== undefined) {
    return isEmpty(data) ? { kind: 'empty' } : { kind: 'ready', data };
  }

  if (result.status === 'error') {
    return { kind: 'error', retry: () => void result.refetch() };
  }

  return { kind: 'loading' };
}
