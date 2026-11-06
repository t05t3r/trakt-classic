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
import { isWatchedInHistory } from '$lib/features/media-actions/isWatchedInHistory.ts';
import type { MediaCard } from '$lib/features/media-card/toMediaCard.ts';
import type { InfiniteQuery } from '$lib/features/query/models/InfiniteQuery.ts';
import { toSectionStatus } from '$lib/features/query/toSectionStatus.ts';
import { useInfiniteQuery } from '$lib/features/query/useQuery.ts';
import type { ImageUrl } from '$lib/requests/models/ImageUrlSchema.ts';
import type { PageMeta } from '$lib/requests/models/Paginatable.ts';
import { withPageClamp } from '$lib/features/paging/withPageClamp.ts';
import { isEmpty } from '$lib/utils/array/isEmpty.ts';
import { FIRST_PAGE } from '$lib/utils/FIRST_PAGE.ts';
import { combineLatest, isObservable, map, type Observable, of } from 'rxjs';

export type PageQuery<TParams, TEntry> = (
  params: TParams & { page: number },
) => InfiniteQuery<TEntry>;

export type CountRead =
  // The page's own length, for a list read as one page: page 1 is read, so a later page
  // clamps to 1 as long as the read's limit is no larger than `pageSize`.
  | 'length'
  // A read of its own, for a filter the page headers ignore.
  | Observable<SectionStatus<number>>;

export type PagedCard = Pick<MediaCard, 'target'>;

export type PagedRow<E, C extends PagedCard> = Readonly<{
  entry: E;
  card: C;
  isFaded: boolean;
  droppedAt?: Date;
}>;

export type PagedReading<E, C extends PagedCard> = Readonly<{
  status: SectionStatus<ReadonlyArray<PagedRow<E, C>>>;
  pages: Readonly<{ current: number; total: number | undefined }>;
  itemCount: number | undefined;
  cover: ImageUrl | undefined;
  // The page's entries once it has landed, the hidden ones included.
  entries: ReadonlyArray<E> | undefined;
}>;

export type UsePagedItemsParams<E, P, C extends PagedCard> = {
  query: PageQuery<P, E>;
  params: P;
  page: number;
  pageSize: number;
  // The page headers when omitted.
  countRead?: CountRead;
  toCard: (entry: E) => C;
  toCover: (entry: E) => ImageUrl;
  // No fade or hide when omitted.
  watched?: Observable<WatchedFilter | null>;
  replacePage: (page: number) => void;
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

type CardedEntry<E, C> = Readonly<{ entry: E; card: C }>;

type PageRead<E, C> = Readonly<{
  result: PageResult<E>;
  // The page's entries, each with its card, once the page has landed.
  carded: ReadonlyArray<CardedEntry<E, C>> | undefined;
  entries: ReadonlyArray<E> | undefined;
  counts: PageCounts;
  cover: ImageUrl | undefined;
}>;

const NO_COUNTS: PageCounts = {
  itemCount: undefined,
  pageCount: undefined,
  isPending: false,
};

function countsOfMeta(meta: PageMeta | undefined): PageCounts {
  if (meta?.type !== 'paginated') return NO_COUNTS;

  return { itemCount: meta.itemCount, pageCount: meta.total, isPending: false };
}

function countsOfCount(count: number, pageSize: number): PageCounts {
  // No items still read as one page.
  return {
    itemCount: count,
    pageCount: Math.max(1, Math.ceil(count / pageSize)),
    isPending: false,
  };
}

function countsOfStatus(
  status: SectionStatus<number>,
  pageSize: number,
): PageCounts {
  switch (status.kind) {
    case 'loading':
      return { ...NO_COUNTS, isPending: true };
    case 'error':
      return { ...NO_COUNTS, error: status };
    case 'empty':
      return countsOfCount(0, pageSize);
    case 'ready':
      return countsOfCount(status.data, pageSize);
  }
}

type PageReadParams<E, C extends PagedCard> =
  & Pick<UsePagedItemsParams<E, unknown, C>, 'toCard' | 'toCover'>
  & { result: PageResult<E>; counts: PageCounts };

function toPageRead<E, C extends PagedCard>(
  { result, counts, toCard, toCover }: PageReadParams<E, C>,
): PageRead<E, C> {
  const entries = firstPageOf(result)?.entries;
  const first = entries?.at(0);

  return {
    result,
    carded: entries?.map((entry) => ({ entry, card: toCard(entry) })),
    entries,
    counts,
    cover: first && toCover(first),
  };
}

function firstPageOf<E>(result: PageResult<E>) {
  return result.data?.pages.at(0);
}

type PageCountsParams = {
  countRead: Exclude<CountRead, Observable<unknown>> | undefined;
  pageSize: number;
};

function countsOfPage<E>(
  result: PageResult<E>,
  { countRead, pageSize }: PageCountsParams,
): PageCounts {
  const page = firstPageOf(result);

  if (page === undefined) return NO_COUNTS;
  if (countRead === undefined) return countsOfMeta(page.page);

  return countsOfCount(page.entries.length, pageSize);
}

type WithCountsParams<E> = {
  read: Observable<PageResult<E>>;
  countRead: CountRead | undefined;
  pageSize: number;
};

// A page's own counts come in its emission, so no reading pairs a page with stale counts.
function withCounts<E>(
  { read, countRead, pageSize }: WithCountsParams<E>,
): Observable<[PageResult<E>, PageCounts]> {
  if (isObservable(countRead)) {
    return combineLatest([
      read,
      countRead.pipe(map((status) => countsOfStatus(status, pageSize))),
    ]);
  }

  const counting = { countRead, pageSize };

  return read.pipe(map((result) => [result, countsOfPage(result, counting)]));
}

type RowsParams<E, C> = {
  carded: ReadonlyArray<CardedEntry<E, C>>;
  history: UserHistory | null;
  dropped: UserDropped | undefined;
  filter: WatchedFilter | null;
};

function toRows<E, C extends PagedCard>(
  { carded, history, dropped, filter }: RowsParams<E, C>,
): ReadonlyArray<PagedRow<E, C>> {
  const isWatched = ({ card }: CardedEntry<E, C>) =>
    history !== null && isWatchedInHistory({ target: card.target, history });

  return applyWatchedFilter({ items: carded, filter, isWatched }).map((
    { item: { entry, card }, isFaded },
  ) => {
    const droppedAt = card.target.type === 'show'
      ? dropped?.shows.get(card.target.id)
      : undefined;

    return { entry, card, isFaded, ...(droppedAt && { droppedAt }) };
  });
}

type ReadingParams<E, C> = Omit<RowsParams<E, C>, 'carded' | 'history'> & {
  page: PageRead<E, C>;
  current: number;
  historyStatus: HistoryStatus;
};

function isPastLastPage<E, C>(
  { carded, counts, current }:
    & Pick<PageRead<E, C>, 'carded' | 'counts'>
    & Pick<ReadingParams<E, C>, 'current'>,
): boolean {
  if (counts.pageCount !== undefined) return current > counts.pageCount;

  // Until the count read lands, a later page that came back empty may lie past the last.
  return counts.isPending && current > FIRST_PAGE &&
    carded !== undefined && isEmpty(carded);
}

function toStatus<E, C extends PagedCard>(
  { page: { result, carded, counts }, historyStatus, current, ...rows }:
    ReadingParams<E, C>,
): PagedReading<E, C>['status'] {
  if (counts.error) return counts.error;
  // Past the last page the clamp's replace is on its way, so its empty answer is no reading.
  if (isPastLastPage({ carded, counts, current })) return { kind: 'loading' };

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

function toReading<E, C extends PagedCard>(
  params: ReadingParams<E, C>,
): PagedReading<E, C> {
  const { page: { entries, counts, cover }, current } = params;

  return {
    status: toStatus(params),
    pages: { current, total: counts.pageCount },
    itemCount: counts.itemCount,
    cover,
    entries,
  };
}

export function usePagedItems<E, P, C extends PagedCard>(
  {
    query,
    params,
    page,
    pageSize,
    countRead,
    toCard,
    toCover,
    watched = of(null),
    replacePage,
  }: UsePagedItemsParams<E, P, C>,
): Observable<PagedReading<E, C>> {
  const readPage = countRead === 'length' ? FIRST_PAGE : page;
  const read = useInfiniteQuery(query({ ...params, page: readPage }));
  const counted = withCounts({ read, countRead, pageSize });
  const pageRead = counted.pipe(
    map(([result, counts]) => toPageRead({ result, counts, toCard, toCover })),
  );
  const { historyStatus, dropped } = useUser();

  const reading = combineLatest([
    pageRead,
    historyStatus,
    dropped,
    watched,
  ]).pipe(
    map(([$page, $historyStatus, $dropped, $filter]) =>
      toReading({
        page: $page,
        current: page,
        historyStatus: $historyStatus,
        dropped: $dropped,
        filter: $filter,
      })
    ),
  );

  return withPageClamp({ reading, page, replacePage });
}
