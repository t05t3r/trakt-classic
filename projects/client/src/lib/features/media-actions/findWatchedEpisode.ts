import type { WatchedEpisode } from '$lib/features/auth/queries/currentUserWatchedShowsQuery.ts';
import type { UserHistory } from '$lib/features/auth/stores/useCurrentUserHistory.ts';

type FindWatchedEpisodeParams = {
  history: UserHistory;
  showId: number;
  episodeId: number;
};

export function findWatchedEpisode(
  { history, showId, episodeId }: FindWatchedEpisodeParams,
): WatchedEpisode | undefined {
  return history.shows.get(showId)?.episodes.find((episode) =>
    episode.episodeId === episodeId
  );
}
