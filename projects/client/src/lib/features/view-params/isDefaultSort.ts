import type {
  SortList,
  SortParam,
} from '$lib/features/view-params/stores/useSortParam.ts';

// A sort list's first entry, at its own direction, is the sort a bare URL reads.
export function isDefaultSort<K extends string>(
  sort: SortParam<K>,
  sorts: SortList<SortParam<K>>,
): boolean {
  const [fallback] = sorts;

  return sort.by === fallback.by && sort.how === fallback.how;
}
