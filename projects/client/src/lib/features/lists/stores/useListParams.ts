import { GENRES } from '$lib/features/filters/GENRES.ts';
import {
  useWatchedFilter,
  type WatchedFilter,
} from '$lib/features/filters/stores/useWatchedFilter.ts';
import { FIRST_PAGE } from '$lib/features/lists/FIRST_PAGE.ts';
import { LIST_SORT } from '$lib/features/lists/LIST_SORT.ts';
import type { ListDisplayType } from '$lib/features/lists/LIST_TYPES.ts';
import {
  type SortParam,
  useSortParam,
} from '$lib/features/view-params/stores/useSortParam.ts';
import { useViewParam } from '$lib/features/view-params/stores/useViewParam.ts';
import type { SortBy } from '$lib/models/SortBy.ts';
import { distinctUntilChanged, map, type Observable } from 'rxjs';

// Page 1 is the URL without a page, so only a later page is a value.
const isLaterPage = (value: string) =>
  /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value)) &&
  value !== String(FIRST_PAGE);

export type ListParams<T extends ListDisplayType> = {
  types: ReadonlyArray<T>;
  sort: Observable<SortParam<SortBy>>;
  type: Observable<T | null>;
  genre: Observable<string | null>;
  page: Observable<number>;
  watched: Observable<WatchedFilter | null>;
  selectSort(by: SortBy): Promise<void>;
  reverseSort(): Promise<void>;
  setType(type: T | null): Promise<void>;
  setGenre(genre: string | null): Promise<void>;
  setWatched(filter: WatchedFilter | null): Promise<void>;
  // In place of the current entry, as for a page past the last.
  replacePage(page: number): Promise<void>;
};

export function useListParams<T extends ListDisplayType>(
  { types }: { types: ReadonlyArray<T> },
): ListParams<T> {
  const sorting = useSortParam(LIST_SORT);
  const watched = useWatchedFilter();
  const { values, set } = useViewParam({
    display: { values: types, fallback: null },
    genres: { values: GENRES, fallback: null },
    page: { values: isLaterPage, fallback: null },
  });

  // Set in the same tick as the sort, so both land in one replace.
  const withPageDropped = (sortWrite: Promise<void>) =>
    Promise.all([sortWrite, set({ page: null })]).then(() => undefined);

  return {
    types,
    sort: sorting.sort,
    type: values.pipe(
      map(({ display }) => types.find((type) => type === display) ?? null),
      distinctUntilChanged(),
    ),
    genre: values.pipe(map(({ genres }) => genres), distinctUntilChanged()),
    page: values.pipe(
      map(({ page }) => page === null ? FIRST_PAGE : Number(page)),
      distinctUntilChanged(),
    ),
    watched: watched.filter,
    selectSort: (by) => withPageDropped(sorting.select(by)),
    reverseSort: () => withPageDropped(sorting.reverse()),
    setType: (type) => set({ display: type, page: null }),
    setGenre: (genre) => set({ genres: genre, page: null }),
    setWatched: watched.set,
    replacePage: (page) =>
      set({ page: page === FIRST_PAGE ? null : String(page) }),
  };
}
