import type { SortParamSpec } from '$lib/features/view-params/stores/useSortParam.ts';

export const SEASONS_SORT = {
  param: 'seasons',
  sorts: [
    { by: 'number', how: 'desc' },
    { by: 'rating', how: 'desc' },
    { by: 'aired', how: 'desc' },
  ],
} as const satisfies SortParamSpec<string>;
