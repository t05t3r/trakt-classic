import type { SortParamSpec } from '$lib/features/view-params/stores/useSortParam.ts';

export const EPISODES_SORT = {
  param: 'episodes',
  sorts: [
    { by: 'number', how: 'asc' },
    { by: 'aired', how: 'asc' },
    { by: 'rating', how: 'desc' },
    { by: 'votes', how: 'desc' },
  ],
} as const satisfies SortParamSpec<string>;
