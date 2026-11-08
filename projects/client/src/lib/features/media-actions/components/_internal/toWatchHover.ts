import {
  toWatchProgress,
  type WatchProgress,
} from '$lib/features/media-actions/_internal/toWatchProgress.ts';
import { nonNegativeFinite } from '$lib/utils/number/nonNegativeFinite.ts';
import type { QuickActionsTarget } from '../QuickActionsProps.ts';
import { hasTargetAired } from './hasTargetAired.ts';

type WatchHoverParams = {
  target: QuickActionsTarget;
  isPlayed: boolean | undefined;
  playedAt: Date | undefined;
  plays: number | undefined;
  watchedEpisodes: number | undefined;
};

export type WatchHoverContent =
  | { kind: 'add' }
  | { kind: 'unreleased' }
  | { kind: 'play'; playedAt: Date; minutes: number | undefined }
  | { kind: 'plays'; count: number; minutes: number | undefined }
  | { kind: 'progress'; progress: WatchProgress };

type WatchMinutesParams = { runtime: number | undefined; plays: number };

// Trakt may give no runtime, and a line reading 0m would claim one.
function toWatchMinutes(
  { runtime, plays }: WatchMinutesParams,
): number | undefined {
  const minutes = nonNegativeFinite(runtime ?? NaN) * plays;

  return minutes > 0 ? minutes : undefined;
}

function toTotal(
  target: Extract<QuickActionsTarget, { type: 'show' | 'season' }>,
): number {
  return target.type === 'show' ? target.episode.count : target.episodes.aired;
}

function toCollectionHover(
  target: Extract<QuickActionsTarget, { type: 'show' | 'season' }>,
  { plays, watchedEpisodes }: Pick<
    WatchHoverParams,
    'plays' | 'watchedEpisodes'
  >,
): WatchHoverContent | undefined {
  if (!plays) return undefined;

  const progress = toWatchProgress({
    completed: watchedEpisodes ?? 0,
    total: toTotal(target),
    plays,
  });

  return progress
    ? { kind: 'progress', progress }
    : { kind: 'plays', count: plays, minutes: undefined };
}

// The history lags a write, so a played title with no counts yet has nothing to say.
export function toWatchHover(
  { target, isPlayed, playedAt, plays, watchedEpisodes }: WatchHoverParams,
): WatchHoverContent | undefined {
  // An unknown history may hold a Play, so the add is not on offer yet.
  if (isPlayed === undefined) return undefined;
  if (!isPlayed) {
    return hasTargetAired(target) ? { kind: 'add' } : { kind: 'unreleased' };
  }

  if (target.type === 'show' || target.type === 'season') {
    return toCollectionHover(target, { plays, watchedEpisodes });
  }

  if (playedAt) {
    const minutes = toWatchMinutes({ runtime: target.runtime, plays: 1 });
    return { kind: 'play', playedAt, minutes };
  }
  if (!plays) return undefined;

  return {
    kind: 'plays',
    count: plays,
    minutes: toWatchMinutes({ runtime: target.runtime, plays }),
  };
}
