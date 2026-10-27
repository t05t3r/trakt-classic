import type { QueryObserverResult } from '@tanstack/query-core';

export const isUnsettled = (
  result: QueryObserverResult<unknown> | undefined,
) => result === undefined || result.status === 'pending';
