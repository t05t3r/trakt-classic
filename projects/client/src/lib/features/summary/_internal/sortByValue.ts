import type { SortParam } from '$lib/features/view-params/stores/useSortParam.ts';

type SortByValueParams<T, K extends string> = {
  items: ReadonlyArray<T>;
  sort: SortParam<K>;
  valueOf: (item: T, by: K) => number | null;
};

export function sortByValue<T extends { number: number }, K extends string>(
  { items, sort, valueOf }: SortByValueParams<T, K>,
): ReadonlyArray<T> {
  const direction = sort.how === 'asc' ? 1 : -1;

  return items.toSorted((a, b) => {
    const left = valueOf(a, sort.by);
    const right = valueOf(b, sort.by);

    if (left === right) return (a.number - b.number) * direction;
    if (left === null) return 1;
    if (right === null) return -1;
    return (left - right) * direction;
  });
}
