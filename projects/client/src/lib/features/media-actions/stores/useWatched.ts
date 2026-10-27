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
import { removeWatchedRequest } from '$lib/requests/sync/removeWatchedRequest.ts';
import { toMarkAsWatchedPayload } from '$lib/requests/sync/toMarkAsWatchedPayload.ts';
import { getLatestDate } from '$lib/utils/date/getLatestDate.ts';
import { seasonLabel } from '$lib/utils/intl/seasonLabel.ts';
import { sum } from '$lib/utils/number/sum.ts';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  filter,
  firstValueFrom,
  map,
  scan,
  shareReplay,
} from 'rxjs';
import { pendingOverrides } from '../_internal/pendingOverrides.ts';
import { findWatchedEpisode } from '../findWatchedEpisode.ts';
import { toTargetKey } from '../_internal/toTargetKey.ts';
import { toWriteErrorMessage } from '../_internal/toWriteErrorMessage.ts';
import { useOptimisticWrite } from '../_internal/useOptimisticWrite.ts';
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

        const plays = sum(show.episodes.map(({ plays }) => plays));
        return { plays, watchedAt: show.watchedAt };
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
  const isUpdating = combineLatest([watchedState.isUpdating, isAddingShow])
    .pipe(
      map(([isOverridden, isAdding]) => isOverridden || isAdding),
      distinctUntilChanged(),
    );

  // A refetch reads not known; holding the last known state keeps the icon from blinking.
  const isWatched = watchedState.isWatched.pipe(
    scan<boolean | undefined, boolean | undefined>(
      (last, state) => state ?? last,
      undefined,
    ),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
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

    isAddingShow.next(true);
    try {
      return await readShowCount();
    } finally {
      isAddingShow.next(false);
    }
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

  const remove = async () => {
    if (media.length === 0) return;
    if (await isPending()) return;

    // Without a known history there is no play count to confirm.
    const $history = await firstValueFrom(history);
    if ($history === null) return;

    const count = countPlays($history);
    if (count === 0) return;

    const isConfirmed = await confirmAsync({
      type: ConfirmationType.RemoveFromHistory,
      title,
      count,
    });
    if (!isConfirmed) return;

    // The confirmed count must still hold, or the remove deletes plays the user never saw.
    const $confirmedHistory = await firstValueFrom(history);
    if ($confirmedHistory === null) return notifyHistoryChanged();
    if (countPlays($confirmedHistory) !== count) return notifyHistoryChanged();
    // A pending write may add plays the count does not show yet, an episode's to its show.
    // Read right before run, with no await between, so no write starts in the gap.
    if (pendingOverrides.isAnyPending('watched')) return notifyHistoryChanged();

    await run({
      keys,
      value: false,
      task: (params) =>
        removeWatchedRequest({
          body: toMarkAsWatchedPayload(props),
          ...params,
        }),
      invalidation,
      supersede: false,
    });
  };

  return {
    isWatched,
    isWatchedKnown,
    pendingWatched,
    plays,
    lastWatchedAt,
    isUpdating,
    add,
    remove,
  };
}
