import type { ProgressFilters } from '$lib/features/progress/ProgressFilters.ts';
import type { SortParam } from '$lib/features/view-params/stores/useSortParam.ts';
import { flipDirection } from '$lib/utils/sort/flipDirection.ts';
import {
  PROGRESS_SORTS,
  type ProgressSortBy,
  type ProgressView,
} from '../PROGRESS_SORTS.ts';

export function toRequestSort<V extends ProgressView>(
  { view, sort }: ProgressFilters<V>,
): SortParam<ProgressSortBy<V>> {
  const sorts: ReadonlyArray<{ by: string; inverted?: true }> =
    PROGRESS_SORTS[view];
  const isInverted = sorts.some(({ by, inverted }) =>
    by === sort.by && inverted
  );

  return isInverted ? { by: sort.by, how: flipDirection(sort.how) } : sort;
}
