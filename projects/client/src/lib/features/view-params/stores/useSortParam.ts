import type { SortDirection } from '$lib/models/SortDirection.ts';
import { distinctUntilChanged, map, type Observable } from 'rxjs';
import { useViewParam } from './useViewParam.ts';

export type SortParam<K extends string> = Readonly<{
  by: K;
  how: SortDirection;
}>;

export type SortParamSpec<K extends string> = Readonly<{
  param: string;
  // Each key at its own default direction, in menu order; the first is the default sort.
  sorts: readonly [SortParam<K>, ...ReadonlyArray<SortParam<K>>];
}>;

const DIRECTIONS: ReadonlyArray<SortDirection> = ['asc', 'desc'];

const toValue = <K extends string>({ by, how }: SortParam<K>) => `${by},${how}`;

const flipped = (how: SortDirection): SortDirection =>
  how === 'asc' ? 'desc' : 'asc';

export function useSortParam<K extends string>(
  { param, sorts }: SortParamSpec<K>,
): {
  sort: Observable<SortParam<K>>;
  isReversed: Observable<boolean>;
  select(by: K): Promise<void>;
  reverse(): Promise<void>;
} {
  const [fallback] = sorts;
  const defaults: ReadonlyMap<K, SortDirection> = new Map(
    sorts.map(({ by, how }) => [by, how]),
  );
  const defaultOf = (by: K) => defaults.get(by) ?? fallback.how;

  const all: ReadonlyArray<SortParam<K>> = sorts.flatMap(({ by }) =>
    DIRECTIONS.map((how) => ({ by, how }))
  );
  // The view param types its value as nullable, so a null reads as a miss.
  const byValue: ReadonlyMap<string | null, SortParam<K>> = new Map(
    all.map((sort) => [toValue(sort), sort]),
  );

  const { values, set } = useViewParam({
    [param]: { values: all.map(toValue), fallback: toValue(fallback) },
  });

  const write = (next: SortParam<K>) => set({ [param]: toValue(next) });

  const toSort = (params: Readonly<Record<string, string | null>>) =>
    byValue.get(params[param] ?? null) ?? fallback;

  const sort = values.pipe(map(toSort), distinctUntilChanged());

  const isReversed = sort.pipe(
    map(({ by, how }) => how !== defaultOf(by)),
    distinctUntilChanged(),
  );

  return {
    sort,
    isReversed,
    select: (by) => write({ by, how: defaultOf(by) }),
    // Flips the sort as the sets before it leave it, not as the URL still reads.
    reverse: () =>
      set((params) => {
        const { by, how } = toSort(params);
        return { [param]: toValue({ by, how: flipped(how) }) };
      }),
  };
}
