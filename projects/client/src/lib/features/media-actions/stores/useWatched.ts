import { useToasts } from '$lib/features/action-toast/stores/useToasts.ts';
import type { WatchedMovie } from '$lib/features/auth/queries/currentUserWatchedMoviesQuery.ts';
import type { UserHistory } from '$lib/features/auth/stores/useCurrentUserHistory.ts';
import { useUser } from '$lib/features/auth/stores/useUser.ts';
import { ConfirmationType } from '$lib/features/confirmation/models/ConfirmationType.ts';
import { useConfirm } from '$lib/features/confirmation/useConfirm.ts';
import * as m from '$lib/features/i18n/messages.ts';
import { useQueryFetcher } from '$lib/features/query/useQueryFetcher.ts';
import type { MarkAsWatchedAt } from '$lib/models/MarkAsWatchedAt.ts';
import type {
  ExtendedMediaStoreProps,
  SeasonMedia,
} from '$lib/models/MediaStoreProps.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import type {
  SeasonProgress,
  ShowProgressDetail,
} from '$lib/requests/models/ShowProgressDetail.ts';
import { showProgressQuery } from '$lib/requests/queries/shows/showProgressQuery.ts';
import {
  type MarkAsWatchedParams,
  markAsWatchedRequest,
} from '$lib/requests/sync/markAsWatchedRequest.ts';
import {
  type RemoveWatchedParams,
  removeWatchedRequest,
} from '$lib/requests/sync/removeWatchedRequest.ts';
import { toMarkAsWatchedPayload } from '$lib/requests/sync/toMarkAsWatchedPayload.ts';
import { getLatestDate } from '$lib/utils/date/getLatestDate.ts';
import { seasonLabel } from '$lib/utils/intl/seasonLabel.ts';
import { getShowWatchState } from '$lib/utils/media/getShowWatchState.ts';
import { SPECIALS } from '$lib/utils/media/SPECIALS.ts';
import { sum } from '$lib/utils/number/sum.ts';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  filter,
  firstValueFrom,
  map,
  type Observable,
  of,
  scan,
  shareReplay,
} from 'rxjs';
import { pendingOverrides } from '../_internal/pendingOverrides.ts';
import { findWatchedEpisode } from '../findWatchedEpisode.ts';
import { overlapsTarget } from '../_internal/overlapsTarget.ts';
import { toTargetKey } from '../_internal/toTargetKey.ts';
import { toWriteErrorMessage } from '../_internal/toWriteErrorMessage.ts';
import {
  type OptimisticWrite,
  useOptimisticWrite,
} from '../_internal/useOptimisticWrite.ts';
import { useIsWatched } from './_internal/useIsWatched.ts';

type ArrayOrSingle<T> = T | T[];
type WatchedMedia = { id: number; title: string };
type WatchedShow = WatchedMedia & { slug: string; episode: { count: number } };
type WatchedSeasons = Extract<ExtendedMediaStoreProps, { type: 'season' }> & {
  show: { id: number; title: string; slug: string };
};

export type WatchedStoreProps =
  | { type: 'movie'; media: ArrayOrSingle<WatchedMedia> }
  | {
    type: 'episode';
    media: ArrayOrSingle<WatchedMedia & { season: number; number: number }>;
    show: { id: number; title: string };
  }
  | { type: 'show'; media: ArrayOrSingle<WatchedShow> }
  | WatchedSeasons;

type ReadHistoryParams = {
  props: WatchedStoreProps;
  ids: ReadonlyArray<number>;
  seasons: ReadonlyArray<SeasonMedia>;
  hasSpecials: boolean;
  $history: UserHistory;
};

type PlayHistory = Pick<WatchedMovie, 'plays' | 'watchedAt'>;

type ShowProgress = { id: number; progress: ShowProgressDetail };

function toSeasonHistory(
  episodes: ReadonlyArray<PlayHistory>,
): PlayHistory | undefined {
  const watchedAt = getLatestDate(episodes.map((episode) => episode.watchedAt));
  if (!watchedAt) return undefined;

  return { plays: sum(episodes.map(({ plays }) => plays)), watchedAt };
}

function countShowPlays($history: UserHistory, showId: number): number {
  const episodes = $history.shows.get(showId)?.episodes ?? [];
  return sum(episodes.map(({ plays }) => plays));
}

function historyPerItem(
  { props, ids, seasons, $history }: ReadHistoryParams,
): ReadonlyArray<PlayHistory | undefined> {
  switch (props.type) {
    case 'movie':
      return ids.map((id) => $history.movies.get(id));
    case 'show':
      return ids.map((id) => {
        const show = $history.shows.get(id);
        if (!show) return undefined;

        return {
          plays: countShowPlays($history, id),
          watchedAt: show.watchedAt,
        };
      });
    case 'episode':
      return ids.map((episodeId) =>
        findWatchedEpisode({
          history: $history,
          showId: props.show.id,
          episodeId,
        })
      );
    case 'season': {
      const watched = $history.shows.get(props.show.id)?.episodes ?? [];
      return seasons.map(({ number }) =>
        toSeasonHistory(watched.filter(({ season }) => season === number))
      );
    }
  }
}

// Specials stay out, as the aired counts these meet leave them out; season 0 has no such count.
function watchedEpisodesIn(
  { props, ids, seasons, hasSpecials, $history }: ReadHistoryParams,
): number | undefined {
  if (props.type === 'show') {
    return sum(ids.map((id) =>
      getShowWatchState({
        watchedShow: $history.shows.get(id),
        episodeCount: null,
      }).watchedEpisodeCount
    ));
  }
  if (props.type !== 'season') return undefined;
  if (hasSpecials) return undefined;

  const watched = $history.shows.get(props.show.id)?.playsPerSeason;
  return sum(seasons.map(({ number }) => watched?.get(number) ?? 0));
}

// Episode numbers only, so each takes the add's watched_at.
function toRemainingSeasons(
  { seasons, numbers }: {
    seasons: ReadonlyArray<SeasonProgress>;
    numbers: ReadonlyArray<number> | undefined;
  },
) {
  return seasons
    .filter(({ number }) => numbers?.includes(number) ?? true)
    .map(({ number, episodes }) => ({
      number,
      episodes: episodes
        .filter(({ completed }) => !completed)
        .map((episode) => ({ number: episode.number })),
    }))
    .filter(({ episodes }) => episodes.length > 0);
}

// A refetch reads not known; holding the last known state keeps the icon from blinking.
function holdKnown(state: Observable<boolean | undefined>) {
  return state.pipe(
    scan<boolean | undefined, boolean | undefined>(
      (last, next) => next ?? last,
      undefined,
    ),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
}

async function whileFlagged<T>(
  flag: BehaviorSubject<boolean>,
  task: () => Promise<T>,
): Promise<T> {
  flag.next(true);
  try {
    return await task();
  } finally {
    flag.next(false);
  }
}

// No query lists the season token; the episode token refetches the shows history and progress.
function toInvalidation({ type }: WatchedStoreProps) {
  return type === 'season'
    ? [
      InvalidateAction.MarkAsWatched('season'),
      InvalidateAction.MarkAsWatched('episode'),
    ]
    : InvalidateAction.MarkAsWatched(type);
}

export function useWatched(props: WatchedStoreProps) {
  const { type } = props;
  const media: ReadonlyArray<WatchedMedia | WatchedShow | SeasonMedia> =
    Array.isArray(props.media) ? props.media : [props.media];
  const ids = media.map(({ id }) => id);
  // A season's progress is its show's.
  const progressShows = props.type === 'season'
    ? [props.show]
    : media.flatMap((item) => 'slug' in item ? [item] : []);
  const keys = media.map((item) => ({
    action: 'watched' as const,
    targetKey: toTargetKey(type, item.id),
  }));
  const targetKeys = keys.map(({ targetKey }) => targetKey);
  const seasons = props.type === 'season' ? [props.media].flat() : [];
  const hasSpecials = seasons.some(({ number }) => number === SPECIALS);
  const title = props.type === 'season'
    ? seasons.map(({ number }) => seasonLabel(number, props.show.title))
      .join(', ')
    : [props.media].flat().map((item) => item.title).join(', ');
  const invalidation = toInvalidation(props);

  const { history } = useUser();
  const { confirmAsync } = useConfirm();
  const { fetch } = useQueryFetcher();
  const { run } = useOptimisticWrite();
  const { notify } = useToasts();
  const watchedState = useIsWatched(props);
  const isReadingProgress = new BehaviorSubject(false);
  // Apart from the Target's overrides: a Play's write flips no Target, and only this card goes pending.
  const isRemovingPlay = new BehaviorSubject(false);
  const isUpdating = combineLatest([
    watchedState.isUpdating,
    isReadingProgress,
    isRemovingPlay,
  ]).pipe(
    map(($updating) => $updating.some(Boolean)),
    distinctUntilChanged(),
  );

  const isWatched = holdKnown(watchedState.isWatched);
  // Reads false while the history refetches or after a failed refetch; a pending write's override reads known; add refuses both, and a confirmed remove waits out another Target's re-read.
  const isWatchedKnown = watchedState.isWatched.pipe(
    map((state) => state !== undefined),
    distinctUntilChanged(),
  );

  // Unlike `isUpdating`, it ignores a show's episode count read.
  const { pendingWatched } = watchedState;

  const readHistory = ($history: UserHistory) =>
    historyPerItem({ props, ids, seasons, hasSpecials, $history });
  const countPlays = ($history: UserHistory) =>
    sum(readHistory($history).map((entry) => entry?.plays ?? 0));
  const readLastWatchedAt = ($history: UserHistory) =>
    getLatestDate(readHistory($history).map((entry) => entry?.watchedAt));
  const knownHistory = history.pipe(
    filter(($history) => $history !== null),
  );
  const plays = knownHistory.pipe(map(countPlays));
  const lastWatchedAt = knownHistory.pipe(map(readLastWatchedAt));
  const watchedEpisodes = knownHistory.pipe(
    map(($history) =>
      watchedEpisodesIn({ props, ids, seasons, hasSpecials, $history })
    ),
  );
  // A refetch reads not known, so a no-Play read before the Target's own write never blocks it after.
  const readKnownPlay = (count: ($history: UserHistory) => number) =>
    history.pipe(
      map(($history) => $history === null ? undefined : count($history) > 0),
    );
  // The history lags the Target's own write, so its pending value wins.
  const readHasPlay = ({ count, afterRemove }: {
    count: ($history: UserHistory) => number;
    afterRemove: Observable<boolean | undefined>;
  }) =>
    combineLatest([readKnownPlay(count), afterRemove, pendingWatched]).pipe(
      map(([$known, $afterRemove, $pending]) => {
        if ($pending === true) return true;
        if ($pending === false) return $afterRemove;

        return $known;
      }),
      distinctUntilChanged(),
    );
  // A remove takes every Play of its own Targets and none of their show's others.
  const hasPlay = readHasPlay({ count: countPlays, afterRemove: of(false) });
  const hasPlayHeld = holdKnown(hasPlay);
  // An episode or season reads its show's; a movie or show is its own.
  const hasShowPlay = props.type === 'episode' || props.type === 'season'
    ? readHasPlay({
      count: ($history) => countShowPlays($history, props.show.id),
      afterRemove: readKnownPlay(($history) =>
        countShowPlays($history, props.show.id) - countPlays($history)
      ),
    })
    : hasPlay;

  const fetchProgress = async (): Promise<
    ReadonlyArray<ShowProgress> | null
  > => {
    try {
      const entries = await Promise.all(
        progressShows.map(async ({ id, slug }) => ({
          id,
          // The history counts a hidden season's episodes, so the progress lists them too.
          progress: await fetch(showProgressQuery({ slug, hidden: true })),
        })),
      );
      const known = entries.flatMap(({ id, progress }) =>
        progress ? [{ id, progress }] : []
      );

      return known.length === entries.length ? known : null;
    } catch {
      return null;
    }
  };

  const countEpisodesToMark = async (): Promise<number | null> => {
    const entries = await fetchProgress();
    if (!entries) return null;

    // Trakt's show-level add plays every aired episode, already-watched ones included.
    return sum(entries.map(({ progress }) => progress.total));
  };

  const notifyFailed = () => {
    const message = toWriteErrorMessage('failed');
    if (message) notify(message);
  };

  const notifyHistoryChanged = () =>
    notify(m.error_text_write_history_changed());

  // The override clears once the history reads every refetched page settled, or not known after a failure.
  const isPending = () => firstValueFrom(watchedState.isUpdating);

  // Without a known history a Target may read unwatched while watched; an add posts another play.
  const isHistoryKnown = async () => await firstValueFrom(history) !== null;

  const markAsWatched = (body: MarkAsWatchedParams['body']) =>
    run({
      keys,
      value: true,
      task: (params) => markAsWatchedRequest({ body, ...params }),
      invalidation,
      supersede: false,
    });

  const addMedia = async (watchedAt: MarkAsWatchedAt) => {
    if (await isPending()) return;
    if (!await isHistoryKnown()) return;

    await markAsWatched(toMarkAsWatchedPayload(props, watchedAt));
  };

  const readShowCount = async (): Promise<number | null> => {
    if (await isPending()) return null;
    if (!await isHistoryKnown()) return null;

    const count = await countEpisodesToMark();
    if (count === null) notifyFailed();
    return count;
  };

  // Spans the count read only; while the confirmation is open, a second add's dialog is refused.
  const readShowCountOnce = async (): Promise<number | null> => {
    // Set before the first await, so a second click during the count read starts nothing.
    if (isReadingProgress.value) return null;

    return await whileFlagged(isReadingProgress, readShowCount);
  };

  const confirmMarkAsWatched = async (
    { count, watchedAt }: { count: number; watchedAt: MarkAsWatchedAt },
  ) => {
    const isConfirmed = await confirmAsync({
      type: ConfirmationType.MarkShowWatched,
      title,
      count,
    });
    if (!isConfirmed) return;

    await markAsWatched(toMarkAsWatchedPayload(props, watchedAt));
  };

  const addShow = async (watchedAt: MarkAsWatchedAt) => {
    const count = await readShowCountOnce();
    if (count === null || count === 0) return;

    await confirmMarkAsWatched({ count, watchedAt });
  };

  const addSeason = async (watchedAt: MarkAsWatchedAt) => {
    const count = sum(seasons.map(({ episodes }) => episodes.aired));
    if (count === 0) return;
    if (await isPending()) return;
    if (!await isHistoryKnown()) return;

    await confirmMarkAsWatched({ count, watchedAt });
  };

  const add = async (watchedAt: MarkAsWatchedAt = 'now') => {
    if (media.length === 0) return;

    switch (props.type) {
      case 'show':
        return await addShow(watchedAt);
      case 'season':
        return await addSeason(watchedAt);
      default:
        return await addMedia(watchedAt);
    }
  };

  const postRemoval = (
    { overrideKeys, body }: {
      overrideKeys: OptimisticWrite['keys'];
      body: RemoveWatchedParams['body'];
    },
  ) =>
    run({
      keys: overrideKeys,
      value: false,
      task: (params) => removeWatchedRequest({ body, ...params }),
      invalidation,
      supersede: false,
    });

  // A pending write may add plays the count does not show yet, an episode's to its show.
  const isOverlappingWritePending = () =>
    pendingOverrides.inFlightOf('watched').some(({ targetKey }) =>
      overlapsTarget({ targetKeys, pendingKey: targetKey })
    );

  // Another Target's re-read reads not known until it lands; a failed one leaves it so once its write clears.
  const readSettledHistory = () =>
    firstValueFrom(
      combineLatest([history, pendingOverrides.inFlightOf$('watched')]).pipe(
        filter(([$history, $inFlight]) =>
          $history !== null || $inFlight.length === 0
        ),
        map(([$history]) => $history),
      ),
    );

  const removeAll = async (count: number) => {
    if (isOverlappingWritePending()) return notifyHistoryChanged();
    // The confirmed count must still hold, or the remove deletes plays the user never saw.
    const $confirmedHistory = await readSettledHistory();
    if ($confirmedHistory === null) return notifyHistoryChanged();
    if (countPlays($confirmedHistory) !== count) return notifyHistoryChanged();
    // Read right before run, with no await between, so no write starts in the gap.
    if (isOverlappingWritePending()) return notifyHistoryChanged();

    await postRemoval({
      overrideKeys: keys,
      body: toMarkAsWatchedPayload(props),
    });
  };

  // Without a known history there is no play count to confirm.
  const readRemovableHistory = async (): Promise<UserHistory | null> => {
    if (media.length === 0) return null;
    if (await isPending()) return null;

    return await firstValueFrom(history);
  };

  const confirmRemoveAll = async (count: number) => {
    const isConfirmed = await confirmAsync({
      type: ConfirmationType.RemoveFromHistory,
      title,
      count,
    });
    if (!isConfirmed) return;

    await removeAll(count);
  };

  // Removes every Play on the alternate answer, so the caller acts on the main one alone.
  const confirmOrRemoveAll = async (
    { type, count }: {
      type:
        | typeof ConfirmationType.WatchRemaining
        | typeof ConfirmationType.RemovePlay;
      count: number;
    },
  ) => {
    const answer = await confirmAsync({ type, title });
    if (answer !== 'alternate') return answer;

    await removeAll(count);
    return false;
  };

  // A replay never fills a season, since its history counts each episode once.
  const isPartlyWatched = ($history: UserHistory) => {
    if (props.type !== 'show' && props.type !== 'season') return false;
    // The progress read leaves specials out, so season 0 has no episodes to add.
    if (hasSpecials) return false;

    return !watchedState.isWatchedIn($history);
  };

  const toRemainingShows = (entries: ReadonlyArray<ShowProgress>) => {
    const numbers = props.type === 'season'
      ? seasons.map(({ number }) => number)
      : undefined;

    return entries
      .map(({ id, progress }) => ({
        id,
        seasons: toRemainingSeasons({ seasons: progress.seasons, numbers }),
      }))
      .filter((show) => show.seasons.length > 0);
  };

  const watchRemaining = async () => {
    if (pendingOverrides.isAnyPending('watched')) return notifyHistoryChanged();

    const entries = await fetchProgress();
    if (!entries) return notifyFailed();

    // Nothing left to add: the history read it partly watched while the progress reads it complete.
    const shows = toRemainingShows(entries);
    if (shows.length === 0) return notifyHistoryChanged();
    // An add may have started during the read; checked with no await before run.
    if (pendingOverrides.isAnyPending('watched')) return notifyHistoryChanged();

    await markAsWatched(
      toMarkAsWatchedPayload({ type: 'show', media: shows }, 'now'),
    );
  };

  const removeOrWatchRemaining = async () => {
    // Up from the progress read until the post settles, so a second click starts nothing.
    if (isReadingProgress.value) return;

    const $history = await readRemovableHistory();
    if ($history === null) return;
    const count = countPlays($history);
    // A filled button with no Play to remove: the history moved since it filled.
    if (count === 0) return notifyHistoryChanged();
    // The count's own read, so a refetch since it cannot turn the prompt into the count dialog.
    if (!isPartlyWatched($history)) return await confirmRemoveAll(count);

    const isConfirmed = await confirmOrRemoveAll({
      type: ConfirmationType.WatchRemaining,
      count,
    });
    if (!isConfirmed) return;

    await whileFlagged(isReadingProgress, watchRemaining);
  };

  const removePlay = async (historyId: number) => {
    // A second removal would clear the flag while the first's post is in flight.
    if (isRemovingPlay.value) return;

    // A Play proves itself, so a history holding no plays only means it lags.
    const $history = await readRemovableHistory();
    if ($history === null) return;

    const isConfirmed = await confirmOrRemoveAll({
      type: ConfirmationType.RemovePlay,
      count: countPlays($history),
    });
    if (!isConfirmed) return;

    await whileFlagged(isRemovingPlay, () =>
      postRemoval({
        overrideKeys: [{ action: 'watched', targetKey: `play:${historyId}` }],
        body: { ids: [historyId] },
      }));
  };

  return {
    isWatched,
    isWatchedKnown,
    pendingWatched,
    plays,
    watchedEpisodes,
    lastWatchedAt,
    hasPlay,
    hasPlayHeld,
    hasShowPlay,
    isUpdating,
    add,
    removeOrWatchRemaining,
    removePlay,
  };
}
