import { useQuery } from '$lib/features/query/useQuery.ts';
import type {
  HistoryParams,
  HistoryTypeFilter,
} from '$lib/features/history/stores/useHistoryParams.ts';
import type { UserStats } from '$lib/requests/models/UserStats.ts';
import { userStatsQuery } from '$lib/requests/queries/users/userStatsQuery.ts';
import { hasDateRange } from '$lib/utils/date/hasDateRange.ts';
import {
  combineLatest,
  distinctUntilChanged,
  map,
  type Observable,
} from 'rxjs';

export type HistoryStats = Readonly<{ items?: number; plays: number }>;

const STATS_OF: Record<HistoryTypeFilter, (stats: UserStats) => HistoryStats> =
  {
    all: ({ episodes, movies }) => ({
      items: episodes.watched + movies.watched,
      plays: episodes.plays + movies.plays,
    }),
    // No items: the stats' show count can exceed the shows the history holds.
    shows: ({ episodes }) => ({ plays: episodes.plays }),
    episodes: ({ episodes }) => ({
      items: episodes.watched,
      plays: episodes.plays,
    }),
    movies: ({ movies }) => ({ items: movies.watched, plays: movies.plays }),
  };

export function useHistoryStats(
  { type, item, genres, range }: Pick<
    HistoryParams,
    'type' | 'item' | 'genres' | 'range'
  >,
): Observable<HistoryStats | undefined> {
  const stats = useQuery(userStatsQuery({ slug: 'me' }));

  return combineLatest({ stats, type, item, genres, range }).pipe(
    map(({ stats: { data }, type, item, genres, range }) => {
      if (!data) return undefined;
      // The stats are the account's totals, with no figure for a title, a genre or a range.
      if (item || genres !== null || hasDateRange(range)) return undefined;

      return STATS_OF[type](data);
    }),
    distinctUntilChanged((a, b) =>
      a?.items === b?.items && a?.plays === b?.plays
    ),
  );
}
