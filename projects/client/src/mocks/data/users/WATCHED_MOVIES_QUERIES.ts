import { currentUserWatchedMoviesQuery } from '$lib/features/auth/queries/currentUserWatchedMoviesQuery.ts';

export const WATCHED_MOVIES_QUERIES = {
  queryKey: [currentUserWatchedMoviesQuery().queryKey.at(0)],
};
