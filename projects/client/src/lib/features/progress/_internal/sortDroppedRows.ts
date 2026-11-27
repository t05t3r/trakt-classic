import type { SortParam } from '$lib/features/view-params/stores/useSortParam.ts';
import { sortByValue } from '$lib/utils/sort/sortByValue.ts';
import type { ProgressSortBy } from '../PROGRESS_SORTS.ts';

export type DroppedRow = Readonly<{
  show: { title: string };
  lastWatchedAt: Date | null;
  hiddenAt: Date;
}>;

type DroppedSortBy = ProgressSortBy<'dropped'>;

type SortDroppedRowsParams<T extends DroppedRow> = {
  rows: ReadonlyArray<T>;
  // The resolved sort_how, not the URL's direction.
  sort: SortParam<DroppedSortBy>;
};

function toSortValue(
  row: DroppedRow,
  by: DroppedSortBy,
): number | string | null {
  if (by === 'title') return row.show.title;
  if (by === 'hidden') return row.hiddenAt.getTime();

  return row.lastWatchedAt?.getTime() ?? null;
}

export function sortDroppedRows<T extends DroppedRow>(
  { rows, sort }: SortDroppedRowsParams<T>,
): ReadonlyArray<T> {
  return sortByValue({ items: rows, sort, valueOf: toSortValue });
}
