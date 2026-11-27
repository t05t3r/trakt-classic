import type { WatchedFilter } from '$lib/features/filters/stores/useWatchedFilter.ts';
import { sortDroppedRows } from '$lib/features/progress/_internal/sortDroppedRows.ts';
import { toRequestSort } from '$lib/features/progress/_internal/toRequestSort.ts';
import type { ProgressFilters } from '$lib/features/progress/ProgressFilters.ts';
import type { ProgressReading } from '$lib/features/progress/ProgressReading.ts';
import { useProgressReading } from '$lib/features/progress/stores/_internal/useProgressReading.ts';
import { isProgressComplete } from '$lib/utils/media/isProgressComplete.ts';
import type { Observable } from 'rxjs';

export type DroppedItemsValues = Readonly<{
  filters: ProgressFilters<'dropped'>;
  watched: WatchedFilter | null;
  page: number;
}>;

type UseDroppedItemsParams = {
  values: DroppedItemsValues;
  replacePage: (page: number) => void;
};

export function useDroppedItems(
  { values: { filters, watched, page }, replacePage }: UseDroppedItemsParams,
): Observable<ProgressReading> {
  const sort = toRequestSort(filters);

  return useProgressReading({
    // The rows come from the shared read without hide_completed, so Hide filters them here.
    select: ({ dropped }) =>
      sortDroppedRows({
        rows: watched === 'hide'
          ? dropped.filter((row) => !isProgressComplete(row))
          : dropped,
        sort,
      }),
    watched,
    page,
    replacePage,
  });
}
