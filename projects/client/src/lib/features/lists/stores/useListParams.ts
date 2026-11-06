import { GENRES } from '$lib/features/filters/GENRES.ts';
import {
  useWatchedFilter,
  type WatchedFilter,
} from '$lib/features/filters/stores/useWatchedFilter.ts';
import { LIST_SORT } from '$lib/features/lists/LIST_SORT.ts';
import type { ListDisplayType } from '$lib/features/lists/LIST_TYPES.ts';
import {
  type PageParam,
  usePageParam,
} from '$lib/features/view-params/stores/usePageParam.ts';
import {
  type SortParam,
  useSortParam,
} from '$lib/features/view-params/stores/useSortParam.ts';
import { useViewParam } from '$lib/features/view-params/stores/useViewParam.ts';
import type { SortBy } from '$lib/models/SortBy.ts';
import { distinctUntilChanged, map, type Observable } from 'rxjs';

export type ListParams<T extends ListDisplayType> = PageParam & {
  types: ReadonlyArray<T>;
  sort: Observable<SortParam<SortBy>>;
  type: Observable<T | null>;
  genre: Observable<string | null>;
  watched: Observable<WatchedFilter | null>;
  selectSort(by: SortBy): Promise<void>;
  reverseSort(): Promise<void>;
  setType(type: T | null): Promise<void>;
  setGenre(genre: string | null): Promise<void>;
  setWatched(filter: WatchedFilter | null): Promise<void>;
};

export function useListParams<T extends ListDisplayType>(
  { types }: { types: ReadonlyArray<T> },
): ListParams<T> {
  const sorting = useSortParam(LIST_SORT);
  const watched = useWatchedFilter();
  const { page, replacePage, withPageDropped } = usePageParam();
  const { values, set } = useViewParam({
    display: { values: types, fallback: null },
    genres: { values: GENRES, fallback: null },
  });

  return {
    types,
    sort: sorting.sort,
    type: values.pipe(
      map(({ display }) => types.find((type) => type === display) ?? null),
      distinctUntilChanged(),
    ),
    genre: values.pipe(map(({ genres }) => genres), distinctUntilChanged()),
    page,
    watched: watched.filter,
    selectSort: (by) => withPageDropped(sorting.select(by)),
    reverseSort: () => withPageDropped(sorting.reverse()),
    setType: (type) => withPageDropped(set({ display: type })),
    setGenre: (genre) => withPageDropped(set({ genres: genre })),
    setWatched: watched.set,
    replacePage,
  };
}
