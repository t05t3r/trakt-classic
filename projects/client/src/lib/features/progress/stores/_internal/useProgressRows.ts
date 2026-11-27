import type {
  NeverEmptyStatus,
  SectionStatus,
} from '$lib/components/feedback/SectionStatus.ts';
import {
  type UserDropped,
  useUser,
} from '$lib/features/auth/stores/useUser.ts';
import {
  type PendingDropLookup,
  usePendingDrops,
} from '$lib/features/media-actions/stores/usePendingDrops.ts';
import {
  type DroppedPartition,
  partitionByDropped,
} from '$lib/features/progress/_internal/partitionByDropped.ts';
import { toFailedStatus } from '$lib/features/query/toFailedStatus.ts';
import { useSnapshotStatus } from '$lib/features/query/useSnapshot.ts';
import {
  type WatchedShowProgress,
  type WatchedShowsProgressParams,
  watchedShowsProgressQuery,
} from '$lib/requests/queries/sync/watchedShowsProgressQuery.ts';
import { dedupe } from '$lib/utils/array/dedupe.ts';
import { combineLatest, map, type Observable } from 'rxjs';

type ProgressRowsReads = [
  SectionStatus<ReadonlyArray<WatchedShowProgress>>,
  SectionStatus<UserDropped>,
  PendingDropLookup,
];

// A show that moves between two page reads comes twice, and has one row.
const dedupeShows = (rows: ReadonlyArray<WatchedShowProgress>) =>
  dedupe(({ show }) => show.id, rows);

// Loading until the dropped list is known too, so a dropped show's row never shows and then leaves.
function toRowsStatus(
  [rows, dropped, isPending]: ProgressRowsReads,
): NeverEmptyStatus<DroppedPartition<WatchedShowProgress>> {
  const failed = toFailedStatus([rows, dropped]);
  if (failed) return failed;
  if (rows.kind !== 'ready' || dropped.kind !== 'ready') {
    return { kind: 'loading' };
  }

  return {
    kind: 'ready',
    data: partitionByDropped({
      rows: rows.data,
      dropped: dropped.data,
      isPending,
    }),
  };
}

export function useProgressRows(
  params?: WatchedShowsProgressParams,
): Observable<NeverEmptyStatus<DroppedPartition<WatchedShowProgress>>> {
  return combineLatest([
    // Emptiness waits for the partition and the caller's own filter.
    useSnapshotStatus(watchedShowsProgressQuery(params), {
      select: dedupeShows,
    }),
    useUser().droppedStatus,
    usePendingDrops(),
  ]).pipe(map(toRowsStatus));
}
