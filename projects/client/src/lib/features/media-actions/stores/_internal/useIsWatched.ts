import type { UserHistory } from '$lib/features/auth/stores/useCurrentUserHistory.ts';
import { useUser } from '$lib/features/auth/stores/useUser.ts';
import {
  type PendingOverride,
  pendingOverrides,
} from '$lib/features/media-actions/_internal/pendingOverrides.ts';
import { toTargetKey } from '$lib/features/media-actions/_internal/toTargetKey.ts';
import { findWatchedEpisode } from '$lib/features/media-actions/findWatchedEpisode.ts';
import type {
  ExtendedMediaStoreProps,
  SeasonMedia,
} from '$lib/models/MediaStoreProps.ts';
import { getShowWatchState } from '$lib/utils/media/getShowWatchState.ts';
import {
  combineLatest,
  distinctUntilChanged,
  map,
  of,
  shareReplay,
} from 'rxjs';

export type IsWatchedProps = ExtendedMediaStoreProps;

type WatchedItem = { id: number; episode?: { count: number } };

type WatchedState = boolean | undefined;

type SnapshotParams = {
  props: IsWatchedProps;
  media: ReadonlyArray<WatchedItem>;
  seasons: ReadonlyArray<SeasonMedia>;
  $history: UserHistory;
};

function toSnapshotStates(
  { props, media, seasons, $history }: SnapshotParams,
): ReadonlyArray<boolean> {
  switch (props.type) {
    case 'movie':
      return media.map(({ id }) => $history.movies.has(id));
    case 'episode':
      return media.map(({ id }) =>
        findWatchedEpisode({
          history: $history,
          showId: props.show.id,
          episodeId: id,
        }) !== undefined
      );
    case 'season': {
      const countBySeason = $history.shows.get(props.show.id)?.playsPerSeason;

      return seasons.map(({ number, episodes }) =>
        episodes.aired > 0 &&
        (countBySeason?.get(number) ?? 0) >= episodes.aired
      );
    }
    case 'show':
      return media.map((show) =>
        getShowWatchState({
          watchedShow: $history.shows.get(show.id),
          episodeCount: show.episode?.count,
        }).isWatched
      );
  }
}

function combineStates(states: ReadonlyArray<WatchedState>): WatchedState {
  if (states.includes(false)) return false;
  if (states.includes(undefined)) return undefined;

  return true;
}

// `undefined` unless every Target has a write pending.
function toPendingWatched(
  overrides: ReadonlyArray<PendingOverride | undefined>,
): WatchedState {
  if (overrides.some((override) => override === undefined)) return undefined;

  return overrides.every((override) => override?.value === true);
}

export function useIsWatched(props: IsWatchedProps) {
  const { type } = props;
  const media: ReadonlyArray<WatchedItem> = Array.isArray(props.media)
    ? props.media
    : [props.media];
  const seasons = props.type === 'season' ? [props.media].flat() : [];
  if (media.length === 0) {
    return {
      isWatched: of<WatchedState>(false),
      isUpdating: of(false),
      pendingWatched: of<WatchedState>(undefined),
    };
  }

  const { history } = useUser();

  const overrides = combineLatest(
    media.map((item) =>
      pendingOverrides.lookup$({
        action: 'watched',
        targetKey: toTargetKey(type, item.id),
      })
    ),
  );

  const isWatched = combineLatest([history, overrides]).pipe(
    map(([$history, $overrides]) => {
      const snapshot = $history
        ? toSnapshotStates({ props, media, seasons, $history })
        : [];

      return combineStates(
        $overrides.map((override, index) =>
          override ? override.value === true : snapshot.at(index)
        ),
      );
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  const isUpdating = overrides.pipe(
    map(($overrides) => $overrides.some((override) => override !== undefined)),
  );

  // The value a pending write leaves, whatever the history reads.
  const pendingWatched = overrides.pipe(
    map(toPendingWatched),
    distinctUntilChanged(),
  );

  return { isWatched, isUpdating, pendingWatched };
}
