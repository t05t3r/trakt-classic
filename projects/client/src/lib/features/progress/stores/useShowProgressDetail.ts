import type {
  NeverEmptyStatus,
  SectionStatus,
} from '$lib/components/feedback/SectionStatus.ts';
import {
  type MediaCard,
  toMediaCard,
} from '$lib/features/media-card/toMediaCard.ts';
import { toFailedStatus } from '$lib/features/query/toFailedStatus.ts';
import { toSectionStatus } from '$lib/features/query/toSectionStatus.ts';
import { useQuery } from '$lib/features/query/useQuery.ts';
import { useSnapshotStatus } from '$lib/features/query/useSnapshot.ts';
import type { EpisodeEntry } from '$lib/requests/models/EpisodeEntry.ts';
import type {
  EpisodeProgress,
  SeasonProgress,
  SeasonRef,
  ShowProgressDetail,
} from '$lib/requests/models/ShowProgressDetail.ts';
import type { Season } from '$lib/requests/models/Season.ts';
import type { ShowEntry } from '$lib/requests/models/ShowEntry.ts';
import { showProgressQuery } from '$lib/requests/queries/shows/showProgressQuery.ts';
import { showSeasonEpisodesQuery } from '$lib/requests/queries/shows/showSeasonEpisodesQuery.ts';
import { showSeasonsQuery } from '$lib/requests/queries/shows/showSeasonsQuery.ts';
import { hiddenSeasonsQuery } from '$lib/requests/queries/users/hiddenSeasonsQuery.ts';
import { isEmpty } from '$lib/utils/array/isEmpty.ts';
import { getLatestDate } from '$lib/utils/date/getLatestDate.ts';
import { indexByNumber } from '$lib/utils/media/indexByNumber.ts';
import type { QueryObserverResult } from '@tanstack/query-core';
import { combineLatest, type Observable, of } from 'rxjs';
import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';

export type SeasonProgressRow = {
  progress: SeasonProgress;
  target: MediaCard<'season'>['target'] | undefined;
};

export type EpisodeSquare = {
  number: number;
  // `announced`: the season lists it but it has not aired; `next`: the show's next episode to watch.
  state: 'watched' | 'unwatched' | 'next' | 'announced';
  // Undefined while the season's episodes load, or when they do not list it.
  episode: EpisodeEntry | undefined;
  // The episode's last watch, null while it is unwatched.
  watchedAt: Date | null;
};

type EpisodeSquaresInput = {
  season: SeasonProgress;
  entries: ReadonlyArray<EpisodeEntry> | undefined;
  next: EpisodeEntry | Nil;
};

// The progress lists only aired episodes; the season's other episodes are announced.
function toEpisodeSquares(
  { season, entries, next }: EpisodeSquaresInput,
): ReadonlyArray<EpisodeSquare> {
  const entryByNumber = indexByNumber(entries ?? []);
  const aired = new Set(season.episodes.map(({ number }) => number));
  const isNext = (number: number) =>
    next?.season === season.number && next.number === number;
  const toState = (
    { number, completed }: EpisodeProgress,
  ): EpisodeSquare['state'] => {
    if (completed) return 'watched';
    return isNext(number) ? 'next' : 'unwatched';
  };

  const announced = (entries ?? [])
    .filter(({ number }) => !aired.has(number))
    .map((episode): EpisodeSquare => ({
      number: episode.number,
      state: 'announced',
      episode,
      watchedAt: null,
    }));

  return [
    ...season.episodes.map((progress): EpisodeSquare => ({
      number: progress.number,
      state: toState(progress),
      episode: entryByNumber.get(progress.number),
      watchedAt: progress.lastWatchedAt,
    })),
    ...announced,
  ];
}

export type WatchedFlags = {
  flags: ReadonlyArray<boolean>;
  // The latest episode watch: the show's own last watch is its highest-numbered watched episode's.
  latestWatchAt: Date | null;
};

type Numbered = { number: number };

type NumberJoin<P extends Numbered, E extends Numbered, T> = {
  progress: ReadonlyArray<P>;
  entries: ReadonlyArray<E> | undefined;
  toTarget: (entry: E) => T;
};

// An item the entries do not list has no ids yet, so its row gets no Target.
function joinByNumber<P extends Numbered, E extends Numbered, T>(
  { progress, entries, toTarget }: NumberJoin<P, E, T>,
): ReadonlyArray<{ progress: P; target: T | undefined }> {
  const entryByNumber = indexByNumber(entries ?? []);

  return progress.map((item) => {
    const entry = entryByNumber.get(item.number);

    return { progress: item, target: entry ? toTarget(entry) : undefined };
  });
}

type SeasonRowsStatus = SectionStatus<ReadonlyArray<SeasonProgressRow>>;

// Without the seasons no row has a Target to act on, so their failure fails the rows.
function withSeasonsFailure(
  rows: SeasonRowsStatus,
  seasons: QueryObserverResult<ReadonlyArray<Season>>,
): SeasonRowsStatus {
  return toFailedStatus([rows, toSectionStatus({ result: seasons })]) ?? rows;
}

type HiddenSeasonsRead = {
  shown: Observable<boolean>;
  // Seasons whose unhide holds until the progress reads again: their rows come from the cached read.
  held: Observable<ReadonlyArray<SeasonRef>>;
};

type ShowProgressDetailOptions = {
  // False reads only what another read of the show cached.
  enabled?: Observable<boolean>;
  // True also reads only the cache while the hidden seasons list loads or leaves the show out.
  onlyWhileHidingSeasons?: boolean;
};

type ShowIdsStatus = NeverEmptyStatus<ReadonlySet<number>>;

// Unknown, the row reads only the cache; failed, every show may hide a season.
function hidesSeasons(status: ShowIdsStatus, id: number): boolean {
  if (status.kind === 'loading') return false;
  if (status.kind === 'error') return true;

  return status.data.has(id);
}

function useHidesSeasons(show$: Observable<ShowEntry>): Observable<boolean> {
  const showIds = useSnapshotStatus(hiddenSeasonsQuery(), {
    select: (entries) => new Set(entries.map(({ showId }) => showId)),
  });

  return combineLatest([show$, showIds]).pipe(
    map(([{ id }, status]) => hidesSeasons(status, id)),
    distinctUntilChanged(),
  );
}

export function useShowProgressDetail(
  show$: Observable<ShowEntry>,
  { enabled = of(true), onlyWhileHidingSeasons = false }:
    ShowProgressDetailOptions = {},
): {
  seasons: Observable<SectionStatus<ReadonlyArray<SeasonProgressRow>>>;
  detail: Observable<ShowProgressDetail | undefined>;
  // Reads the query client when called; empty, and no read, while neither shown nor held.
  seasonsWithHidden: (
    hidden: HiddenSeasonsRead,
  ) => Observable<SectionStatus<ReadonlyArray<SeasonProgressRow>>>;
  // Reads the query client when called, so a component calls it in its setup; a hidden season's progress comes from the caller.
  episodes: (
    season$: Observable<SeasonProgress>,
  ) => Observable<ReadonlyArray<EpisodeSquare>>;
  // Undefined while not read, until another read of the show has cached its progress.
  watchedFlags: Observable<WatchedFlags | undefined>;
} {
  const isRead = onlyWhileHidingSeasons
    ? combineLatest([enabled, useHidesSeasons(show$)]).pipe(
      map(([isEnabled, hidesSeasons]) => isEnabled && hidesSeasons),
    )
    : enabled;
  const progress = useQuery(
    combineLatest([show$, isRead]).pipe(
      map(([{ slug }, isEnabled]) =>
        showProgressQuery({ slug, enabled: isEnabled })
      ),
    ),
  );
  const seasons = useQuery(
    show$.pipe(map(({ slug }) => showSeasonsQuery({ slug }))),
  );

  const toSeasonRows = (
    { show, progress, entries }: {
      show: ShowEntry;
      progress: ReadonlyArray<SeasonProgress>;
      entries: ReadonlyArray<Season> | undefined;
    },
  ) =>
    joinByNumber({
      progress,
      entries,
      toTarget: (season) =>
        toMediaCard({ type: 'season', show, season }).target,
    });

  const seasonsWithHidden = ({ shown, held }: HiddenSeasonsRead) => {
    const withHidden = useQuery(
      combineLatest([show$, shown]).pipe(
        map(([{ slug }, isShown]) =>
          showProgressQuery({ slug, hidden: true, enabled: isShown })
        ),
      ),
    );

    const rows = combineLatest([show$, withHidden, seasons, shown, held]).pipe(
      map(([show, result, seasonsResult, isShown, heldSeasons]) =>
        withSeasonsFailure(
          toSectionStatus({
            result,
            select: (data) =>
              toSeasonRows({
                show,
                progress: isShown
                  ? data.seasons
                  : data.seasons.filter(({ number }) =>
                    heldSeasons.some((season) => season.number === number)
                  ),
                entries: seasonsResult.data,
              }),
            isEmpty,
          }),
          seasonsResult,
        )
      ),
    );

    return combineLatest([shown, held]).pipe(
      map(([isShown, heldSeasons]) => isShown || !isEmpty(heldSeasons)),
      distinctUntilChanged(),
      switchMap((isRead) => isRead ? rows : of({ kind: 'empty' as const })),
    );
  };

  const episodes = (season$: Observable<SeasonProgress>) => {
    const entries = useQuery(
      combineLatest([show$, season$]).pipe(
        map(([{ slug }, { number }]) =>
          showSeasonEpisodesQuery({ slug, season: number })
        ),
      ),
    );

    return combineLatest([season$, progress, entries]).pipe(
      map(([season, progressResult, entriesResult]) =>
        toEpisodeSquares({
          season,
          entries: entriesResult.data,
          next: progressResult.data?.nextEpisode,
        })
      ),
    );
  };

  return {
    seasons: combineLatest([show$, progress, seasons]).pipe(
      map(([show, progressResult, seasonsResult]) =>
        withSeasonsFailure(
          toSectionStatus({
            result: progressResult,
            select: ({ seasons: progress }) =>
              toSeasonRows({ show, progress, entries: seasonsResult.data }),
            // A show whose every season is hidden still lists them, once they are shown.
            isEmpty: (rows) =>
              isEmpty(rows) &&
              isEmpty(progressResult.data?.hiddenSeasons ?? []),
          }),
          seasonsResult,
        )
      ),
    ),
    detail: progress.pipe(map(({ data }) => data)),
    seasonsWithHidden,
    episodes,
    watchedFlags: progress.pipe(
      map(({ data }) =>
        data && {
          flags: data.seasons.flatMap(({ episodes }) =>
            episodes.map(({ completed }) => completed)
          ),
          latestWatchAt: getLatestDate(
            data.seasons.map(({ lastWatchedAt }) => lastWatchedAt),
          ) ?? null,
        }
      ),
    ),
  };
}
