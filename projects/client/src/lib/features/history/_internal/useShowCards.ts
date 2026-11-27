import {
  type UserDropped,
  useUser,
} from '$lib/features/auth/stores/useUser.ts';
import {
  groupPlaysByShow,
  type ShowPlays,
} from '$lib/features/history/_internal/groupPlaysByShow.ts';
import type { HistoryReading } from '$lib/features/history/stores/useHistoryItems.ts';
import { toShowPlays } from '$lib/features/history/_internal/toShowPlays.ts';
import {
  type ListItemCard,
  toListItemCard,
} from '$lib/features/media-card/toListItemCard.ts';
import { toListItemCover } from '$lib/features/media-card/toListItemCover.ts';
import type { PagedRow } from '$lib/features/paging/stores/usePagedItems.ts';
import { toClientPage } from '$lib/features/paging/toClientPage.ts';
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

function toRow(
  entry: ShowPlays,
  dropped: UserDropped | undefined,
): PagedRow<ShowPlays, ListItemCard> {
  const droppedAt = dropped?.shows.get(entry.show.id);

  return {
    entry,
    card: toListItemCard(entry),
    isFaded: false,
    ...(droppedAt && { droppedAt }),
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
      toClientPage({
        status: $status,
        page,
        pageSize: HISTORY_PAGE_SIZE,
        toRow: (entry) => toRow(entry, $dropped),
        toCover: toListItemCover,
      })
    ),
  );

  return withPageClamp({ reading, page, replacePage });
}
