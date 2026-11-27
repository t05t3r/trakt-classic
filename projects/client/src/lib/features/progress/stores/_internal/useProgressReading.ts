import type { WatchedFilter } from '$lib/features/filters/stores/useWatchedFilter.ts';
import { withPageClamp } from '$lib/features/paging/withPageClamp.ts';
import type { DroppedPartition } from '$lib/features/progress/_internal/partitionByDropped.ts';
import { toProgressReading } from '$lib/features/progress/_internal/toProgressReading.ts';
import type {
  ProgressListEntry,
  ProgressReading,
} from '$lib/features/progress/ProgressReading.ts';
import { useProgressRows } from '$lib/features/progress/stores/_internal/useProgressRows.ts';
import type {
  WatchedShowProgress,
  WatchedShowsProgressParams,
} from '$lib/requests/queries/sync/watchedShowsProgressQuery.ts';
import { map, type Observable } from 'rxjs';

type UseProgressReadingParams = {
  params?: WatchedShowsProgressParams;
  select: (
    partition: DroppedPartition<WatchedShowProgress>,
  ) => ReadonlyArray<ProgressListEntry>;
  watched: WatchedFilter | null;
  page: number;
  replacePage: (page: number) => void;
};

export function useProgressReading(
  { params, select, watched, page, replacePage }: UseProgressReadingParams,
): Observable<ProgressReading> {
  const reading = useProgressRows(params).pipe(
    map((status) =>
      toProgressReading({
        status: status.kind === 'ready'
          ? { kind: 'ready', data: select(status.data) }
          : status,
        watched,
        page,
      })
    ),
  );

  return withPageClamp({ reading, page, replacePage });
}
