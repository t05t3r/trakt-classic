import type {
  FailedStatus,
  SectionStatus,
} from '$lib/components/feedback/SectionStatus.ts';
import {
  useSnapshot,
  useSnapshotStatus,
} from '$lib/features/query/useSnapshot.ts';
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

export type UserHistory = {
  movies: Map<number, WatchedMovie>;
  shows: Map<number, WatchedShow>;
};

function toWatchedMap<T extends { id: number }>(
  entries: ReadonlyArray<T>,
): Map<number, T> {
  return new Map(entries.map((entry) => [entry.id, entry]));
}

// A history is never empty: no plays is a known history like any other.
export type HistoryStatus = Exclude<
  SectionStatus<UserHistory>,
  { kind: 'empty' }
>;

type PartStatus<T> = SectionStatus<Map<number, T>>;

function isFailed(part: SectionStatus<unknown>): part is FailedStatus {
  return part.kind === 'error';
}

function toHistoryStatus(
  [movies, shows]: [PartStatus<WatchedMovie>, PartStatus<WatchedShow>],
): HistoryStatus {
  const failed = [movies, shows].filter(isFailed);
  if (failed.length > 0) {
    return {
      kind: 'error',
      retry: () => failed.forEach(({ retry }) => retry()),
    };
  }
  if (movies.kind === 'ready' && shows.kind === 'ready') {
    return { kind: 'ready', data: { movies: movies.data, shows: shows.data } };
  }

  return { kind: 'loading' };
}

type UseCurrentUserHistoryResult = {
  history: Observable<UserHistory | null>;
  // Held through a refetch, so a filter on it keeps what it hid.
  historyStatus: Observable<HistoryStatus>;
};

export function useCurrentUserHistory(): UseCurrentUserHistoryResult {
  const moviesQuery = currentUserWatchedMoviesQuery();
  const showsQuery = currentUserWatchedShowsQuery();

  // A held, partial or failed read could show a watched Target unwatched; a click adds a play.
  const history = combineLatest([
    useSnapshot(moviesQuery, {
      select: toWatchedMap,
      whileUnsettled: 'unknown',
    }),
    useSnapshot(showsQuery, {
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

  const historyStatus = combineLatest([
    useSnapshotStatus(moviesQuery, {
      select: toWatchedMap,
      isEmpty: () => false,
    }),
    useSnapshotStatus(showsQuery, {
      select: toWatchedMap,
      isEmpty: () => false,
    }),
  ]).pipe(map(toHistoryStatus), multicast());

  return { history, historyStatus };
}
