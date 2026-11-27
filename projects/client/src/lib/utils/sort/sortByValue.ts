import type { SortParam } from '$lib/features/view-params/stores/useSortParam.ts';

type SortValue = number | string;

type SortByValueParams<T, K extends string> = {
  items: ReadonlyArray<T>;
  sort: SortParam<K>;
  valueOf: (item: T, by: K) => SortValue | null;
  tieOf?: (item: T) => number;
};

function compareValues(left: SortValue, right: SortValue): number {
  if (typeof left === 'number' && typeof right === 'number') {
    return left - right;
  }

  return String(left).localeCompare(String(right));
}

export function sortByValue<T, K extends string>(
  { items, sort, valueOf, tieOf }: SortByValueParams<T, K>,
): ReadonlyArray<T> {
  const direction = sort.how === 'asc' ? 1 : -1;
  // Without a tie value, toSorted's stable order keeps equal items as given.
  const compareTies = (a: T, b: T) => tieOf ? tieOf(a) - tieOf(b) : 0;

  return items.toSorted((a, b) => {
    const left = valueOf(a, sort.by);
    const right = valueOf(b, sort.by);

    if (left === null && right === null) return compareTies(a, b) * direction;
    if (left === null) return 1;
    if (right === null) return -1;
    return (compareValues(left, right) || compareTies(a, b)) * direction;
  });
}
