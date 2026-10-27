import { currentUserWatchedShowsQuery } from '$lib/features/auth/queries/currentUserWatchedShowsQuery.ts';

export const WATCHED_SHOWS_QUERIES = {
  queryKey: [currentUserWatchedShowsQuery().queryKey.at(0)],
};
