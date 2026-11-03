import { useUser } from '$lib/features/auth/stores/useUser.ts';
import {
  type PendingOverride,
  pendingOverrides,
} from '$lib/features/media-actions/_internal/pendingOverrides.ts';
import { toTargetKey } from '$lib/features/media-actions/_internal/toTargetKey.ts';
import {
  isWatchedInHistory,
  type WatchedInHistoryTarget,
} from '$lib/features/media-actions/isWatchedInHistory.ts';
import type {
  ExtendedMediaStoreProps,
  SeasonMedia,
} from '$lib/models/MediaStoreProps.ts';
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

type TargetsParams = {
  props: IsWatchedProps;
  media: ReadonlyArray<WatchedItem>;
  seasons: ReadonlyArray<SeasonMedia>;
};

function toWatchedTargets(
  { props, media, seasons }: TargetsParams,
): ReadonlyArray<WatchedInHistoryTarget> {
  switch (props.type) {
    case 'movie':
      return media.map(({ id }) => ({ type: 'movie', id }));
    case 'episode':
      return media.map(({ id }) => ({ type: 'episode', id, show: props.show }));
    case 'season':
      return seasons.map(({ number, episodes }) => ({
        type: 'season',
        number,
        episodes,
        show: props.show,
      }));
    case 'show':
      return media.map(({ id, episode }) => ({ type: 'show', id, episode }));
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
  const targets = toWatchedTargets({ props, media, seasons });

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
        ? targets.map((target) =>
          isWatchedInHistory({ target, history: $history })
        )
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
