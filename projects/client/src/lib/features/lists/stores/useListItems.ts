import type { ListEntry } from '$lib/features/lists/ListEntry.ts';
import {
  LIST_TYPES,
  type ListDisplayType,
} from '$lib/features/lists/LIST_TYPES.ts';
import type { ListParams } from '$lib/features/lists/stores/useListParams.ts';
import {
  useWatchedPercentage,
  type WatchedPercentage,
} from '$lib/features/lists/stores/useWatchedPercentage.ts';
import { toItemRuntime } from '$lib/features/lists/toItemRuntime.ts';
import { toListTypeSegment } from '$lib/features/lists/toListTypeSegment.ts';
import { toFavoriteCard } from '$lib/features/media-card/toFavoriteCard.ts';
import {
  type ListItemCard,
  toListItemCard,
} from '$lib/features/media-card/toListItemCard.ts';
import { toListItemCover } from '$lib/features/media-card/toListItemCover.ts';
import { isHiddenAll } from '$lib/features/paging/isHiddenAll.ts';
import {
  type PagedReading,
  type PagedRow,
  usePagedItems,
  type UsePagedItemsParams,
} from '$lib/features/paging/stores/usePagedItems.ts';
import { useSnapshotStatus } from '$lib/features/query/useSnapshot.ts';
import type { SortParam } from '$lib/features/view-params/stores/useSortParam.ts';
import type { SortBy } from '$lib/models/SortBy.ts';
import { mediaFavoritesQuery } from '$lib/requests/queries/media/mediaFavoritesQuery.ts';
import { watchlistGenreCountQuery } from '$lib/requests/queries/users/watchlistGenreCountQuery.ts';
import { watchlistQuery } from '$lib/requests/queries/users/watchlistQuery.ts';
import { LIST_PAGE_SIZE } from '$lib/utils/LIST_PAGE_SIZE.ts';
import { map, type Observable, shareReplay } from 'rxjs';

export type ListItemsValues<T extends ListDisplayType> = Readonly<{
  sort: SortParam<SortBy>;
  type: T | null;
  genre: string | null;
  page: number;
}>;

export type ListItemsRow = PagedRow<ListEntry, ListItemCard>;

type ListItemsReading =
  & Omit<PagedReading<ListEntry, ListItemCard>, 'entries'>
  & Readonly<{
    // The runtime of the page's items, the hidden ones included.
    minutes: number | undefined;
    // A type or genre filter, or a hide that left none of the page's items.
    isFiltered: boolean;
  }>;

export type ListItems = {
  reading: Observable<ListItemsReading>;
  // Built once per count, so its caller keys it on the count.
  watched: (count: number) => Observable<WatchedPercentage | undefined>;
};

type UseListItemsParams = {
  list: keyof typeof LIST_TYPES;
  params: Pick<ListParams<ListDisplayType>, 'watched' | 'replacePage'>;
  values: ListItemsValues<ListDisplayType>;
};

type Arm = {
  reading: Observable<PagedReading<ListEntry, ListItemCard>>;
  watched: ListItems['watched'];
};

type ArmParams<E extends ListEntry, P> = Omit<
  UsePagedItemsParams<E, P, ListItemCard>,
  'pageSize' | 'watched' | 'replacePage'
>;

type Paging = UseListItemsParams['params'];

// The list's params carry a page stream too, so only these two reach the store.
function useArm<E extends ListEntry, P>(
  arm: ArmParams<E, P>,
  { watched, replacePage }: Paging,
): Arm {
  const { query, params, toCard } = arm;

  return {
    reading: usePagedItems({
      ...arm,
      pageSize: LIST_PAGE_SIZE,
      watched,
      replacePage,
    }),
    watched: (count) =>
      useWatchedPercentage({
        query,
        params,
        count,
        toTarget: (entry) => toCard(entry).target,
      }),
  };
}

// The grid and the watched percentage share these, so they share page 1.
function toReadParams<T extends ListDisplayType>(values: ListItemsValues<T>) {
  return {
    sortBy: values.sort.by,
    sortHow: values.sort.how,
    type: toListTypeSegment(values.type),
    filter: values.genre === null ? undefined : { genres: values.genre },
  };
}

function useWatchlistArm(
  values: ListItemsValues<ListDisplayType>,
  paging: Paging,
): Arm {
  const params = toReadParams(values);
  const { type, filter } = params;

  return useArm({
    query: watchlistQuery,
    params,
    page: values.page,
    countRead: filter === undefined ? undefined : useSnapshotStatus(
      watchlistGenreCountQuery({ type, filter }),
      { select: (entries) => entries.length, isEmpty: (count) => count === 0 },
    ),
    toCard: toListItemCard,
    toCover: toListItemCover,
  }, paging);
}

function useFavoritesArm(
  values: ListItemsValues<ListDisplayType>,
  paging: Paging,
): Arm {
  const { favorites } = LIST_TYPES;
  const type = favorites.find((each) => each === values.type) ?? null;

  return useArm({
    query: mediaFavoritesQuery,
    params: { slug: 'me', ...toReadParams({ ...values, type }) },
    page: values.page,
    countRead: 'length',
    toCard: toFavoriteCard,
    toCover: ({ item }) => item.cover.url.full,
  }, paging);
}

function useListArm({ list, params, values }: UseListItemsParams): Arm {
  switch (list) {
    case 'watchlist':
      return useWatchlistArm(values, params);
    case 'favorites':
      return useFavoritesArm(values, params);
  }
}

type ReadingParams = {
  paged: PagedReading<ListEntry, ListItemCard>;
  values: ListItemsValues<ListDisplayType>;
};

function toReading({ paged, values }: ReadingParams): ListItemsReading {
  const { status, pages, itemCount, cover, entries } = paged;

  return {
    status,
    pages,
    itemCount,
    minutes: entries?.reduce((sum, entry) => sum + toItemRuntime(entry), 0),
    cover,
    isFiltered: values.type !== null || values.genre !== null ||
      isHiddenAll(paged),
  };
}

export function useListItems(
  { list, params, values }: UseListItemsParams,
): ListItems {
  const arm = useListArm({ list, params, values });

  return {
    reading: arm.reading.pipe(
      map((paged) => toReading({ paged, values })),
      shareReplay({ bufferSize: 1, refCount: true }),
    ),
    watched: arm.watched,
  };
}
