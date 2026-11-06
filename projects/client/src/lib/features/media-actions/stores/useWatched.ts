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
import type { ShowProgressDetail } from '$lib/requests/models/ShowProgressDetail.ts';
import { showProgressQuery } from '$lib/requests/queries/shows/showProgressQuery.ts';
import { markAsWatchedRequest } from '$lib/requests/sync/markAsWatchedRequest.ts';
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
  show: { id: number; title: string };
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
  $history: UserHistory;
};

type PlayHistory = Pick<WatchedMovie, 'plays' | 'watchedAt'>;

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
  { props, ids, seasons, $history }: ReadHistoryParams,
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
  if (seasons.some(({ number }) => number === SPECIALS)) return undefined;

  const watched = $history.shows.get(props.show.id)?.playsPerSeason;
  return sum(seasons.map(({ number }) => watched?.get(number) ?? 0));
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
  const slugs = media.flatMap((item) => 'slug' in item ? [item.slug] : []);
  const keys = media.map((item) => ({
    action: 'watched' as const,
    targetKey: toTargetKey(type, item.id),
  }));
  const seasons = props.type === 'season' ? [props.media].flat() : [];
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
  const isAddingShow = new BehaviorSubject(false);
  // Apart from the Target's overrides: a Play's write flips no Target, and only this card goes pending.
  const isRemovingPlay = new BehaviorSubject(false);
  const isUpdating = combineLatest([
    watchedState.isUpdating,
    isAddingShow,
    isRemovingPlay,
  ]).pipe(
    map(($updating) => $updating.some(Boolean)),
    distinctUntilChanged(),
  );

  const isWatched = holdKnown(watchedState.isWatched);
  // Reads false while the history refetches or after a failed refetch; a pending write's override reads known, and add and remove refuse both.
  const isWatchedKnown = watchedState.isWatched.pipe(
    map((state) => state !== undefined),
    distinctUntilChanged(),
  );

  // Unlike `isUpdating`, it ignores a show's episode count read.
  const { pendingWatched } = watchedState;

  const readHistory = ($history: UserHistory) =>
    historyPerItem({ props, ids, seasons, $history });
  const countPlays = ($history: UserHistory) =>
    sum(readHistory($history).map((entry) => entry?.plays ?? 0));
  const readLastWatchedAt = ($history: UserHistory) =>
    getLatestDate(
      readHistory($history).flatMap((entry) => entry ? [entry.watchedAt] : []),
    );
  const knownHistory = history.pipe(
    filter(($history) => $history !== null),
  );
  const plays = knownHistory.pipe(map(countPlays));
  const lastWatchedAt = knownHistory.pipe(map(readLastWatchedAt));
  const watchedEpisodes = knownHistory.pipe(
    map(($history) => watchedEpisodesIn({ props, ids, seasons, $history })),
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

  const countEpisodesToMark = async (): Promise<number | null> => {
    try {
      const progress: ReadonlyArray<ShowProgressDetail | Nil> = await Promise
        .all(
          slugs.map((slug) => fetch(showProgressQuery({ slug }))),
        );
      const entries = progress.filter((entry) => entry != null);
      if (entries.length !== progress.length) return null;

      // Trakt's show-level add plays every aired episode, already-watched ones included.
      return sum(entries.map(({ total }) => total));
    } catch {
      return null;
    }
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

  const markAsWatched = (watchedAt: MarkAsWatchedAt) =>
    run({
      keys,
      value: true,
      task: (params) =>
        markAsWatchedRequest({
          body: toMarkAsWatchedPayload(props, watchedAt),
          ...params,
        }),
      invalidation,
      supersede: false,
    });

  const addMedia = async (watchedAt: MarkAsWatchedAt) => {
    if (await isPending()) return;
    if (!await isHistoryKnown()) return;

    await markAsWatched(watchedAt);
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
    if (isAddingShow.value) return null;

    return await whileFlagged(isAddingShow, readShowCount);
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

    await markAsWatched(watchedAt);
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

  const removeAll = async (count: number) => {
    // The confirmed count must still hold, or the remove deletes plays the user never saw.
    const $confirmedHistory = await firstValueFrom(history);
    if ($confirmedHistory === null) return notifyHistoryChanged();
    if (countPlays($confirmedHistory) !== count) return notifyHistoryChanged();
    // A pending write may add plays the count does not show yet, an episode's to its show.
    // Read right before run, with no await between, so no write starts in the gap.
    if (pendingOverrides.isAnyPending('watched')) return notifyHistoryChanged();

    await postRemoval({
      overrideKeys: keys,
      body: toMarkAsWatchedPayload(props),
    });
  };

  const readRemovableCount = async (): Promise<number | null> => {
    if (media.length === 0) return null;
    if (await isPending()) return null;

    // Without a known history there is no play count to confirm.
    const $history = await firstValueFrom(history);
    return $history === null ? null : countPlays($history);
  };

  const remove = async () => {
    const count = await readRemovableCount();
    if (count === null) return;
    // A filled button with no Play to remove: the history moved since it filled.
    if (count === 0) return notifyHistoryChanged();

    const isConfirmed = await confirmAsync({
      type: ConfirmationType.RemoveFromHistory,
      title,
      count,
    });
    if (!isConfirmed) return;

    await removeAll(count);
  };

  const removePlay = async (historyId: number) => {
    // A second removal would clear the flag while the first's post is in flight.
    if (isRemovingPlay.value) return;

    // A Play proves itself, so a count of 0 only means the history lags.
    const count = await readRemovableCount();
    if (count === null) return;

    const answer = await confirmAsync({
      type: ConfirmationType.RemovePlay,
      title,
    });
    if (answer === 'alternate') return await removeAll(count);
    if (!answer) return;

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
    remove,
    removePlay,
  };
}
