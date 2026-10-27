import { useSnapshot } from '$lib/features/query/useSnapshot.ts';
import { multicast } from '$lib/utils/store/multicast.ts';
import { combineLatest, distinctUntilChanged, map, Observable } from 'rxjs';
import {
  currentUserWatchedMoviesQuery,
  type WatchedMovie,
} from '../queries/currentUserWatchedMoviesQuery.ts';
import {
  currentUserWatchedShowsQuery,
  type WatchedShow,
} from '../queries/currentUserWatchedShowsQuery.ts';

const showsHistoryLimit = 1000;
const moviesHistoryLimit = 10000;

export type UserHistory = {
  movies: Map<number, WatchedMovie>;
  shows: Map<number, WatchedShow>;
};

function toWatchedMap<T extends { id: number }>(
  entries: ReadonlyArray<T>,
): Map<number, T> {
  return new Map(entries.map((entry) => [entry.id, entry]));
}

type UseCurrentUserHistoryResult = {
  history: Observable<UserHistory | null>;
};

export function useCurrentUserHistory(): UseCurrentUserHistoryResult {
  // A held, partial or failed read could show a watched Target unwatched; a click adds a play.
  const history = combineLatest([
    useSnapshot(currentUserWatchedMoviesQuery({ limit: moviesHistoryLimit }), {
      select: toWatchedMap,
      whileUnsettled: 'unknown',
    }),
    useSnapshot(currentUserWatchedShowsQuery({ limit: showsHistoryLimit }), {
      select: toWatchedMap,
      whileUnsettled: 'unknown',
    }),
  ]).pipe(
    map(([movies, shows]): UserHistory | null => {
      if (movies === undefined || shows === undefined) return null;

      return { movies, shows };
    }),
    distinctUntilChanged((prev, curr) => prev === null && curr === null),
    // Shared, so every subscriber reads the one history built per change.
    multicast(),
  );

  return { history };
}
