import { MAX_PAGE_LIMIT } from '$lib/requests/MAX_PAGE_LIMIT.ts';
import { blockedUsersQuery } from '$lib/requests/queries/users/blockedUsersQuery.ts';
import { droppedShowsQuery } from '$lib/requests/queries/users/droppedShowsQuery.ts';
import { map } from 'rxjs';
import { getContext, setContext } from 'svelte';
import { useQuery } from '$lib/features/query/useQuery.ts';
import { useSnapshot } from '$lib/features/query/useSnapshot.ts';
import {
  currentUserCommentReactionsQuery,
  type UserReactions,
} from '../queries/currentUserCommentReactionsQuery.ts';
import { currentUserFavoritesQuery } from '../queries/currentUserFavoritesQuery.ts';
import {
  currentUserLikesQuery,
  type UserLikes,
} from '../queries/currentUserLikesQuery.ts';
import {
  currentUserNetworkQuery,
  type UserNetwork,
} from '../queries/currentUserNetworkQuery.ts';
import { currentUserRatingsQuery } from '../queries/currentUserRatingsQuery.ts';
import {
  currentUserRewatchingQuery,
  type UserRewatching,
} from '../queries/currentUserRewatchingQuery.ts';
import { currentUserSettingsQuery } from '../queries/currentUserSettingsQuery.ts';
import {
  currentUserWatchlistQuery,
  type WatchlistedTarget,
} from '../queries/currentUserWatchlistQuery.ts';
import { useCurrentUserHistory } from './useCurrentUserHistory.ts';

const USE_USER_CONTEXT_KEY = Symbol('use-user');

type UseUserInstance = ReturnType<typeof createUseUserInstance>;

type IdSet = ReadonlySet<number>;
type ListedDates = ReadonlyMap<number, Date>;
type UserWatchlist = {
  movies: ListedDates;
  shows: ListedDates;
  seasons: ListedDates;
  episodes: ListedDates;
};
type UserDropped = { shows: IdSet };

function toWatchlistSnapshot(
  entries: ReadonlyArray<WatchlistedTarget>,
): UserWatchlist {
  const datesOf = (type: WatchlistedTarget['type']) =>
    new Map(
      entries
        .filter((entry) => entry.type === type)
        .map(({ id, listedAt }) => [id, listedAt]),
    );

  return {
    movies: datesOf('movie'),
    shows: datesOf('show'),
    seasons: datesOf('season'),
    episodes: datesOf('episode'),
  };
}

// No anonymous branch: it runs only under a Session, and its readers render while it loads.
// `user` keeps the whole query result: callers need `.isError`/`.refetch()`.
function createUseUserInstance() {
  const userQuerySignal = useQuery(currentUserSettingsQuery());
  const ratingsQuerySignal = useQuery(currentUserRatingsQuery());
  const reactionsQuerySignal = useQuery(currentUserCommentReactionsQuery());
  const favoritesQuerySignal = useQuery(currentUserFavoritesQuery());
  const networkQuerySignal = useQuery(currentUserNetworkQuery());
  const likesQuerySignal = useQuery(currentUserLikesQuery());
  const rewatchingQuerySignal = useQuery(currentUserRewatchingQuery());
  const blockedQuerySignal = useQuery(blockedUsersQuery());
  const { history } = useCurrentUserHistory();

  return {
    user: userQuerySignal,
    history,
    ratings: ratingsQuerySignal.pipe(map((query) => query.data)),
    reactions: reactionsQuerySignal.pipe(
      map((query): UserReactions | undefined => query.data),
    ),
    favorites: favoritesQuerySignal.pipe(map((query) => query.data)),
    watchlist: useSnapshot(currentUserWatchlistQuery(), {
      select: toWatchlistSnapshot,
      whileUnsettled: 'hold',
    }),
    dropped: useSnapshot(droppedShowsQuery({ limit: MAX_PAGE_LIMIT }), {
      select: (entries): UserDropped => ({
        shows: new Set(entries.map((entry) => entry.show.id)),
      }),
      whileUnsettled: 'hold',
    }),
    network: networkQuerySignal.pipe(
      map((query): UserNetwork | undefined => query.data),
    ),
    likes: likesQuerySignal.pipe(
      map((query): UserLikes | undefined => query.data),
    ),
    rewatching: rewatchingQuerySignal.pipe(
      map((query): UserRewatching | undefined => query.data),
    ),
    blocked: blockedQuerySignal.pipe(
      map((query) =>
        new Set(
          (query.data ?? [])
            .map((profile) => profile.slug)
            .filter((slug): slug is string => Boolean(slug)),
        )
      ),
    ),
  };
}

// Memoize per AuthProvider scope so descendants share one instance of the
// user query chain. `AuthProvider` seeds the context; any call below it
// returns the same set of observables instead of spawning fresh
// `useQuery(...)` setups.
export function useUser(): UseUserInstance {
  const existing = getContext<UseUserInstance | undefined>(
    USE_USER_CONTEXT_KEY,
  );
  if (existing) return existing;

  const instance = createUseUserInstance();
  setContext(USE_USER_CONTEXT_KEY, instance);
  return instance;
}
