import type {
  FailedStatus,
  SectionStatus,
} from '$lib/components/feedback/SectionStatus.ts';
import type {
  HistoryStatus,
  UserHistory,
} from '$lib/features/auth/stores/useCurrentUserHistory.ts';
import {
  type UserDropped,
  useUser,
} from '$lib/features/auth/stores/useUser.ts';
import { applyWatchedFilter } from '$lib/features/filters/applyWatchedFilter.ts';
import type { WatchedFilter } from '$lib/features/filters/stores/useWatchedFilter.ts';
import { withWatchedKnown } from '$lib/features/filters/withWatchedKnown.ts';
import { FIRST_PAGE } from '$lib/features/lists/FIRST_PAGE.ts';
import type { ListEntry } from '$lib/features/lists/ListEntry.ts';
import {
  LIST_TYPES,
  type ListDisplayType,
} from '$lib/features/lists/LIST_TYPES.ts';
import type { ListParams } from '$lib/features/lists/stores/useListParams.ts';
import {
  type PageQuery,
  useWatchedPercentage,
  type WatchedPercentage,
} from '$lib/features/lists/stores/useWatchedPercentage.ts';
import { toItemRuntime } from '$lib/features/lists/toItemRuntime.ts';
import { toListTypeSegment } from '$lib/features/lists/toListTypeSegment.ts';
import { isWatchedInHistory } from '$lib/features/media-actions/isWatchedInHistory.ts';
import { toFavoriteCard } from '$lib/features/media-card/toFavoriteCard.ts';
import {
  type ListItemCard,
  toListItemCard,
} from '$lib/features/media-card/toListItemCard.ts';
import { toSectionStatus } from '$lib/features/query/toSectionStatus.ts';
import { useInfiniteQuery } from '$lib/features/query/useQuery.ts';
import { useSnapshotStatus } from '$lib/features/query/useSnapshot.ts';
import type { SortParam } from '$lib/features/view-params/stores/useSortParam.ts';
import type { SortBy } from '$lib/models/SortBy.ts';
import type { ImageUrl } from '$lib/requests/models/ImageUrlSchema.ts';
import type { ListItem } from '$lib/requests/models/ListItem.ts';
import type {
  PageMeta,
  Paginatable,
} from '$lib/requests/models/Paginatable.ts';
import { mediaFavoritesQuery } from '$lib/requests/queries/media/mediaFavoritesQuery.ts';
import { watchlistGenreCountQuery } from '$lib/requests/queries/users/watchlistGenreCountQuery.ts';
import { watchlistQuery } from '$lib/requests/queries/users/watchlistQuery.ts';
import { isEmpty } from '$lib/utils/array/isEmpty.ts';
import { LIST_PAGE_SIZE } from '$lib/utils/LIST_PAGE_SIZE.ts';
import { multicast } from '$lib/utils/store/multicast.ts';
import {
  combineLatest,
  distinctUntilChanged,
  filter,
  ignoreElements,
  isObservable,
  map,
  merge,
  type Observable,
  shareReplay,
  tap,
} from 'rxjs';

export type ListItemsValues<T extends ListDisplayType> = Readonly<{
  sort: SortParam<SortBy>;
  type: T | null;
  genre: string | null;
  page: number;
}>;

export type ListItemsRow = Readonly<{
  entry: ListEntry;
  card: ListItemCard;
  isFaded: boolean;
  droppedAt?: Date;
}>;

type ListItemsReading = Readonly<{
  status: SectionStatus<ReadonlyArray<ListItemsRow>>;
  pages: Readonly<{ current: number; total: number | undefined }>;
  itemCount: number | undefined;
  // The runtime of the page's items, the hidden ones included.
  minutes: number | undefined;
  cover: ImageUrl | undefined;
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

type PageCounts = Readonly<{
  itemCount: number | undefined;
  pageCount: number | undefined;
  // A count read of its own has yet to land.
  isPending: boolean;
  // A count read of its own failed.
  error?: FailedStatus;
}>;

type PageResult<E> = ReturnType<
  typeof useInfiniteQuery<E, Error>
> extends Observable<infer R> ? R : never;

type CountRead =
  // The page headers.
  | null
  // The page's own length, for a list read as one page.
  | 'length'
  // A read of its own, for a filter the page headers ignore.
  | Observable<SectionStatus<number>>;

type CardedEntry = Readonly<{ entry: ListEntry; card: ListItemCard }>;

type ArmPage = Readonly<{
  result: PageResult<ListEntry>;
  // The page's entries, each with its card, once the page has landed.
  carded: ReadonlyArray<CardedEntry> | undefined;
  counts: PageCounts;
  cover: ImageUrl | undefined;
}>;

type Arm = {
  page: Observable<ArmPage>;
  watched: ListItems['watched'];
};

type ArmParams<E extends ListEntry, P> = {
  query: PageQuery<P, E>;
  params: P;
  page: number;
  countRead: CountRead;
  toCard: (entry: E) => ListItemCard;
  toCover: (entry: E) => ImageUrl;
};

const NO_COUNTS: PageCounts = {
  itemCount: undefined,
  pageCount: undefined,
  isPending: false,
};

function countsOfMeta(meta: PageMeta | undefined): PageCounts {
  if (meta?.type !== 'paginated') return NO_COUNTS;

  return { itemCount: meta.itemCount, pageCount: meta.total, isPending: false };
}

function countsOfCount(count: number): PageCounts {
  // An empty List still reads as one page.
  return {
    itemCount: count,
    pageCount: Math.max(1, Math.ceil(count / LIST_PAGE_SIZE)),
    isPending: false,
  };
}

function countsOfStatus(status: SectionStatus<number>): PageCounts {
  switch (status.kind) {
    case 'loading':
      return { ...NO_COUNTS, isPending: true };
    case 'error':
      return { ...NO_COUNTS, error: status };
    case 'empty':
      return countsOfCount(0);
    case 'ready':
      return countsOfCount(status.data);
  }
}

type ArmPageParams<E extends ListEntry> =
  & Pick<ArmParams<E, unknown>, 'toCard' | 'toCover'>
  & { result: PageResult<E>; counts: PageCounts };

function toArmPage<E extends ListEntry>(
  { result, counts, toCard, toCover }: ArmPageParams<E>,
): ArmPage {
  const entries = firstPageOf(result)?.entries;
  const first = entries?.at(0);

  return {
    result,
    carded: entries?.map((entry) => ({ entry, card: toCard(entry) })),
    counts,
    cover: first && toCover(first),
  };
}

function firstPageOf<E>(result: PageResult<E>) {
  return result.data?.pages.at(0);
}

function countsOfPage<E>(
  page: Paginatable<E> | undefined,
  countRead: Exclude<CountRead, Observable<unknown>>,
): PageCounts {
  if (page === undefined) return NO_COUNTS;
  if (countRead === null) return countsOfMeta(page.page);

  return countsOfCount(page.entries.length);
}

// A page's own counts come in its emission, so no reading pairs a page with stale counts.
function withCounts<E>(
  read: Observable<PageResult<E>>,
  countRead: CountRead,
): Observable<[PageResult<E>, PageCounts]> {
  if (isObservable(countRead)) {
    return combineLatest([read, countRead.pipe(map(countsOfStatus))]);
  }

  return read.pipe(
    map((result) => [result, countsOfPage(firstPageOf(result), countRead)]),
  );
}

function useArm<E extends ListEntry, P>(
  { query, params, page, countRead, toCard, toCover }: ArmParams<E, P>,
): Arm {
  const read = useInfiniteQuery(query({ ...params, page }));
  const counted = withCounts(read, countRead);

  return {
    page: counted.pipe(
      map(([result, counts]) => toArmPage({ result, counts, toCard, toCover })),
    ),
    watched: (count) =>
      useWatchedPercentage({
        query,
        params,
        count,
        toTarget: (entry) => toCard(entry).target,
      }),
  };
}

// A season or an episode shows its show's fanart.
function toWatchlistCover(item: ListItem): ImageUrl {
  switch (item.type) {
    case 'movie':
    case 'show':
      return item.entry.cover.url.full;
    case 'season':
    case 'episode':
      return item.entry.show.cover.url.full;
  }
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

function useWatchlistArm(values: ListItemsValues<ListDisplayType>): Arm {
  const params = toReadParams(values);
  const { type, filter } = params;

  return useArm({
    query: watchlistQuery,
    params,
    page: values.page,
    countRead: filter === undefined ? null : useSnapshotStatus(
      watchlistGenreCountQuery({ type, filter }),
      { select: (entries) => entries.length, isEmpty: (count) => count === 0 },
    ),
    toCard: toListItemCard,
    toCover: toWatchlistCover,
  });
}

function useFavoritesArm(values: ListItemsValues<ListDisplayType>): Arm {
  const { favorites } = LIST_TYPES;
  const type = favorites.find((each) => each === values.type) ?? null;

  return useArm({
    query: mediaFavoritesQuery,
    params: { slug: 'me', ...toReadParams({ ...values, type }) },
    page: FIRST_PAGE,
    countRead: 'length',
    toCard: toFavoriteCard,
    toCover: ({ item }) => item.cover.url.full,
  });
}

function useListArm(
  { list, values }: Pick<UseListItemsParams, 'list' | 'values'>,
): Arm {
  switch (list) {
    case 'watchlist':
      return useWatchlistArm(values);
    case 'favorites':
      return useFavoritesArm(values);
  }
}

type RowsParams = {
  carded: ReadonlyArray<CardedEntry>;
  history: UserHistory | null;
  dropped: UserDropped | undefined;
  filter: WatchedFilter | null;
};

function toRows(
  { carded, history, dropped, filter }: RowsParams,
): ReadonlyArray<ListItemsRow> {
  const isWatched = ({ card }: CardedEntry) =>
    history !== null && isWatchedInHistory({ target: card.target, history });

  return applyWatchedFilter({ items: carded, filter, isWatched }).map((
    { item: { entry, card }, isFaded },
  ) => {
    const droppedAt = dropped?.shows.get(card.target.id);

    return { entry, card, isFaded, ...(droppedAt && { droppedAt }) };
  });
}

type ReadingParams = Omit<RowsParams, 'carded' | 'history'> & {
  page: ArmPage;
  historyStatus: HistoryStatus;
  values: ListItemsValues<ListDisplayType>;
};

function isPastLastPage(
  { carded, counts, values }:
    & Pick<ArmPage, 'carded' | 'counts'>
    & Pick<ReadingParams, 'values'>,
): boolean {
  if (counts.pageCount !== undefined) return values.page > counts.pageCount;

  // Until the count read lands, a later page that came back empty may lie past the last.
  return counts.isPending && values.page > FIRST_PAGE &&
    carded !== undefined && isEmpty(carded);
}

function toStatus(
  { page: { result, carded, counts }, historyStatus, values, ...rows }:
    ReadingParams,
): ListItemsReading['status'] {
  if (counts.error) return counts.error;
  // Past the last page the clamp's replace is on its way, so its empty answer is no reading.
  if (isPastLastPage({ carded, counts, values })) return { kind: 'loading' };

  const history = historyStatus.kind === 'ready' ? historyStatus.data : null;
  const status = toSectionStatus({
    result,
    select: () => toRows({ carded: carded ?? [], history, ...rows }),
    isEmpty,
  });

  return withWatchedKnown({
    status,
    filter: rows.filter,
    known: historyStatus,
  });
}

function toReading(params: ReadingParams): ListItemsReading {
  const { page: { carded, counts, cover }, values } = params;
  const status = toStatus(params);
  const isHiddenAll = status.kind === 'empty' && !isEmpty(carded ?? []);

  return {
    status,
    pages: { current: values.page, total: counts.pageCount },
    itemCount: counts.itemCount,
    minutes: carded?.reduce((sum, { entry }) => sum + toItemRuntime(entry), 0),
    cover,
    isFiltered: values.type !== null || values.genre !== null || isHiddenAll,
  };
}

export function useListItems(
  { list, params, values }: UseListItemsParams,
): ListItems {
  const arm = useListArm({ list, values });
  const { historyStatus, dropped } = useUser();

  const reading = combineLatest([
    arm.page,
    historyStatus,
    dropped,
    params.watched,
  ]).pipe(
    map(([page, $historyStatus, $dropped, $filter]) =>
      toReading({
        page,
        values,
        historyStatus: $historyStatus,
        dropped: $dropped,
        filter: $filter,
      })
    ),
    multicast(),
  );

  const clampPage = reading.pipe(
    map(({ pages }) => pages.total),
    distinctUntilChanged(),
    filter((total): total is number =>
      total !== undefined && values.page > total
    ),
    tap((total) => params.replacePage(total)),
    ignoreElements(),
  );

  return {
    // The clamp leaves with the last reader, so a replaced view's late count rewrites no URL.
    reading: merge(reading, clampPage).pipe(
      shareReplay({ bufferSize: 1, refCount: true }),
    ),
    watched: arm.watched,
  };
}
