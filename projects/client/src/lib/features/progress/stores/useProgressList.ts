import type { WatchedFilter } from '$lib/features/filters/stores/useWatchedFilter.ts';
import { toRequestSort } from '$lib/features/progress/_internal/toRequestSort.ts';
import type { ProgressFilters } from '$lib/features/progress/ProgressFilters.ts';
import type { ProgressReading } from '$lib/features/progress/ProgressReading.ts';
import { useProgressReading } from '$lib/features/progress/stores/_internal/useProgressReading.ts';
import type { WatchedShowProgress } from '$lib/requests/queries/sync/watchedShowsProgressQuery.ts';
import type { Observable } from 'rxjs';

export type ProgressListValues = Readonly<{
  filters: ProgressFilters<'watched'>;
  watched: WatchedFilter | null;
  show: number | null;
  page: number;
}>;

type UseProgressListParams = {
  values: ProgressListValues;
  replacePage: (page: number) => void;
};

const undatedRank = ({ lastWatchedAt }: WatchedShowProgress) =>
  Number(lastWatchedAt === null);

export function useProgressList(
  { values: { filters, watched, show, page }, replacePage }:
    UseProgressListParams,
): Observable<ProgressReading> {
  const sort = toRequestSort(filters);
  const isByWatchedDate = sort.by === 'added';

  return useProgressReading({
    params: {
      sortBy: sort.by,
      sortHow: sort.how,
      hideCompleted: watched === 'hide',
    },
    select: ({ watched: rows }) => {
      const shown = show === null
        ? rows
        : rows.filter((row) => row.show.id === show);

      // The served order puts the shows never watched first when ascending; Watched Date lists them last both ways.
      return isByWatchedDate
        ? shown.toSorted((a, b) => undatedRank(a) - undatedRank(b))
        : shown;
    },
    watched,
    page,
    replacePage,
  });
}
