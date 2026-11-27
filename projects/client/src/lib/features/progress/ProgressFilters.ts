import type {
  ProgressSortBy,
  ProgressView,
} from '$lib/features/progress/PROGRESS_SORTS.ts';
import type { SortParam } from '$lib/features/view-params/stores/useSortParam.ts';

// Distributive, so the bare type is a union that a check on `view` narrows.
export type ProgressFilters<V extends ProgressView = ProgressView> = V extends
  ProgressView ? Readonly<{ view: V; sort: SortParam<ProgressSortBy<V>> }>
  : never;
