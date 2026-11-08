import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
import {
  type UserDropped,
  useUser,
} from '$lib/features/auth/stores/useUser.ts';
import {
  groupPlaysByShow,
  type ShowPlays,
} from '$lib/features/history/_internal/groupPlaysByShow.ts';
import type {
  HistoryReading,
  HistoryRow,
} from '$lib/features/history/stores/useHistoryItems.ts';
import { toShowPlays } from '$lib/features/history/_internal/toShowPlays.ts';
import { toListItemCard } from '$lib/features/media-card/toListItemCard.ts';
import { toListItemCover } from '$lib/features/media-card/toListItemCover.ts';
import { withPageClamp } from '$lib/features/paging/withPageClamp.ts';
import { useSnapshotStatus } from '$lib/features/query/useSnapshot.ts';
import { MAX_PAGE_LIMIT } from '$lib/requests/MAX_PAGE_LIMIT.ts';
import { watchedShowsProgressQuery } from '$lib/requests/queries/sync/watchedShowsProgressQuery.ts';
import {
  type ShowActivityHistoryParams,
  showActivityHistoryQuery,
} from '$lib/requests/queries/users/showActivityHistoryQuery.ts';
import { isEmpty } from '$lib/utils/array/isEmpty.ts';
import { HISTORY_PAGE_SIZE } from '$lib/utils/HISTORY_PAGE_SIZE.ts';
import { combineLatest, map, type Observable } from 'rxjs';

const LOADING = { kind: 'loading' } as const;

type ToReadingParams = {
  status: SectionStatus<ReadonlyArray<ShowPlays>>;
  dropped: UserDropped | undefined;
  page: number;
};

function toRow(entry: ShowPlays, dropped: UserDropped | undefined): HistoryRow {
  const droppedAt = dropped?.shows.get(entry.show.id);

  return {
    entry,
    card: toListItemCard(entry),
    isFaded: false,
    ...(droppedAt && { droppedAt }),
  };
}

function toReading(
  { status, dropped, page }: ToReadingParams,
): HistoryReading {
  if (status.kind === 'loading' || status.kind === 'error') {
    return {
      status,
      pages: { current: page, total: undefined },
      itemCount: undefined,
      cover: undefined,
      entries: undefined,
    };
  }

  const shows = status.kind === 'ready' ? status.data : [];
  // No shows still read as one page.
  const total = Math.max(1, Math.ceil(shows.length / HISTORY_PAGE_SIZE));
  const entries = shows.slice(
    (page - 1) * HISTORY_PAGE_SIZE,
    page * HISTORY_PAGE_SIZE,
  );
  const first = entries.at(0);
  const landed = isEmpty(entries) ? { kind: 'empty' } as const : {
    kind: 'ready',
    data: entries.map((entry) => toRow(entry, dropped)),
  } as const;

  return {
    // Past the last page the clamp's replace is on its way, so its empty answer is no reading.
    status: page > total ? LOADING : landed,
    pages: { current: page, total },
    itemCount: shows.length,
    cover: first && toListItemCover(first),
    entries,
  };
}

// The progress route has one row per show but takes no genre or date, so a filtered view groups every Play.
function useShowPlays(params: ShowActivityHistoryParams) {
  return params.filter || params.startDate || params.endDate
    ? useSnapshotStatus(
      showActivityHistoryQuery({ ...params, limit: MAX_PAGE_LIMIT }),
      { select: groupPlaysByShow, isEmpty },
    )
    : useSnapshotStatus(
      watchedShowsProgressQuery(),
      { select: toShowPlays, isEmpty },
    );
}

type UseShowCardsParams = {
  params: ShowActivityHistoryParams;
  page: number;
  replacePage: (page: number) => void;
};

export function useShowCards(
  { params, page, replacePage }: UseShowCardsParams,
): Observable<HistoryReading> {
  const reading = combineLatest([useShowPlays(params), useUser().dropped]).pipe(
    map(([$status, $dropped]) =>
      toReading({ status: $status, dropped: $dropped, page })
    ),
  );

  return withPageClamp({ reading, page, replacePage });
}
