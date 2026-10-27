import type { UserStats } from '$lib/requests/models/UserStats.ts';
import type { UserStatsResponse } from '@trakt/api';

export function mapToUserStats(response: UserStatsResponse): UserStats {
  return {
    movies: {
      plays: response.movies.plays,
      watched: response.movies.watched,
      minutes: response.movies.minutes,
      ratings: response.movies.ratings,
      comments: response.movies.comments,
    },
    shows: {
      watched: response.shows.watched,
      ratings: response.shows.ratings,
      comments: response.shows.comments,
    },
    seasons: {
      ratings: response.seasons.ratings,
      comments: response.seasons.comments,
    },
    episodes: {
      plays: response.episodes.plays,
      watched: response.episodes.watched,
      minutes: response.episodes.minutes,
      ratings: response.episodes.ratings,
      comments: response.episodes.comments,
    },
    network: {
      followers: response.network.followers,
      following: response.network.following,
    },
    ratings: {
      total: response.ratings.total,
      distribution: response.ratings.distribution,
    },
  };
}
