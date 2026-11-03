import type { UserHistory } from '$lib/features/auth/stores/useCurrentUserHistory.ts';
import { findWatchedEpisode } from '$lib/features/media-actions/findWatchedEpisode.ts';
import { getShowWatchState } from '$lib/utils/media/getShowWatchState.ts';

export type WatchedInHistoryTarget =
  | { type: 'movie'; id: number }
  | { type: 'episode'; id: number; show: { id: number } }
  | {
    type: 'season';
    number: number;
    episodes: { aired: number };
    show: { id: number };
  }
  | { type: 'show'; id: number; episode?: { count: number } };

type IsWatchedInHistoryParams = {
  target: WatchedInHistoryTarget;
  history: UserHistory;
};

export function isWatchedInHistory(
  { target, history }: IsWatchedInHistoryParams,
): boolean {
  switch (target.type) {
    case 'movie':
      return history.movies.has(target.id);
    case 'episode':
      return findWatchedEpisode({
        history,
        showId: target.show.id,
        episodeId: target.id,
      }) !== undefined;
    case 'season': {
      const plays = history.shows.get(target.show.id)?.playsPerSeason.get(
        target.number,
      );

      return target.episodes.aired > 0 &&
        (plays ?? 0) >= target.episodes.aired;
    }
    case 'show':
      return getShowWatchState({
        watchedShow: history.shows.get(target.id),
        episodeCount: target.episode?.count,
      }).isWatched;
  }
}
