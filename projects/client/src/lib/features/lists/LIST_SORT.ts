import type { SortBy } from '$lib/models/SortBy.ts';
import type { SortParamSpec } from '$lib/features/view-params/stores/useSortParam.ts';

export const LIST_SORT = {
  param: 'sort',
  sorts: [
    { by: 'rank', how: 'asc' },
    { by: 'added', how: 'desc' },
    { by: 'title', how: 'asc' },
    { by: 'released', how: 'desc' },
    { by: 'runtime', how: 'desc' },
    { by: 'popularity', how: 'desc' },
    { by: 'percentage', how: 'desc' },
    { by: 'votes', how: 'desc' },
    { by: 'my_rating', how: 'desc' },
  ],
} as const satisfies SortParamSpec<SortBy>;
