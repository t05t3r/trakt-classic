import { http, HttpResponse } from 'msw';
import { pageHeaders } from '$mocks/pageHeaders.ts';

import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { LIST_TYPES } from '$lib/features/lists/LIST_TYPES.ts';
import { toListTypeSegment } from '$lib/features/lists/toListTypeSegment.ts';
import { AllListedShowsResponseMock } from '$mocks/data/lists/response/AllListedShowsResponseMock.ts';
import { ListedMoviesResponseMock } from '$mocks/data/lists/response/ListedMoviesResponseMock.ts';
import { ListedShowsResponseMock } from '$mocks/data/lists/response/ListedShowsResponseMock.ts';
import { HereticListsMappedMock } from '$mocks/data/summary/movies/heretic/mapped/HereticListsMappedMock.ts';
import { SiloListsMappedMock } from '$mocks/data/summary/shows/silo/mapped/SiloListsMappedMock.ts';
import { SiloListsResponseMock } from '$mocks/data/summary/shows/silo/response/SiloListsResponseMock.ts';
import { WatchlistPreviewResponseMock } from '$mocks/data/sync/response/WatchlistPreviewResponseMock.ts';
import { UserProfileHarryMappedMock } from '$mocks/data/users/mapped/UserProfileHarryMappedMock.ts';
import { CollaborationListsResponseMock } from '$mocks/data/users/response/CollaborationListsResponseMock.ts';
import { ExtendedUserProfileHarryResponseMock } from '$mocks/data/users/response/ExtendedUserProfileHarryResponseMock.ts';
import { PersonalListsResponseMock } from '$mocks/data/users/response/PersonalListsResponseMock.ts';
import { RatedShowsResponseMock } from '$mocks/data/users/response/RatedShowsResponseMock.ts';
import { DroppedShowsResponseMock } from '$mocks/data/users/response/DroppedShowsResponseMock.ts';
import { DropShowResponseMock } from '$mocks/data/users/response/DropShowResponseMock.ts';
import { ListItemIdsResponseMock } from '$mocks/data/users/response/ListItemIdsResponseMock.ts';
import { RestoreShowResponseMock } from '$mocks/data/users/response/RestoreShowResponseMock.ts';
import { ActivityHistoryResponseMock } from '$mocks/data/users/response/ActivityHistoryResponseMock.ts';
import { EpisodeActivityHistoryResponseMock } from '$mocks/data/users/response/EpisodeActivityHistoryResponseMock.ts';
import { ExtendedUserSettingsResponseMock } from '$mocks/data/users/response/ExtendedUserSettingsResponseMock.ts';
import { FavoritedMediaResponseMock } from '$mocks/data/users/response/FavoritedMediaResponseMock.ts';
import { FavoritedMoviesResponseMock } from '$mocks/data/users/response/FavoritedMoviesResponseMock.ts';
import { FavoritedShowsResponseMock } from '$mocks/data/users/response/FavoritedShowsResponseMock.ts';
import { HiddenShowProgressResponseMock } from '$mocks/data/users/response/HiddenShowProgressResponseMock.ts';
import { MinimalLikedListsResponseMock } from '$mocks/data/users/response/MinimalLikedListsResponseMock.ts';
import { MovieActivityHistoryResponseMock } from '$mocks/data/users/response/MovieActivityHistoryResponseMock.ts';
import { RatedEpisodesResponseMock } from '$mocks/data/users/response/RatedEpisodesResponseMock.ts';
import { RatedMoviesResponseMock } from '$mocks/data/users/response/RatedMoviesResponseMock.ts';
import { RatedSeasonsResponseMock } from '$mocks/data/users/response/RatedSeasonsResponseMock.ts';
import { RewatchingShowsResponseMock } from '$mocks/data/users/response/RewatchingShowsResponseMock.ts';
import { ShowActivityHistoryResponseMock } from '$mocks/data/users/response/ShowActivityHistoryResponseMock.ts';
import { UserBlockedResponseMock } from '$mocks/data/users/response/UserBlockedResponseMock.ts';
import { UserFollowersResponseMock } from '$mocks/data/users/response/UserFollowersResponseMock.ts';
import { UserFollowRequestsResponseMock } from '$mocks/data/users/response/UserFollowRequestsResponseMock.ts';
import { UserFollowingResponseMock } from '$mocks/data/users/response/UserFollowingResponseMock.ts';
import { UserMonthInReviewResponseMock } from '$mocks/data/users/response/UserMonthInReviewResponseMock.ts';
import { UserPendingFollowsResponseMock } from '$mocks/data/users/response/UserPendingFollowsResponseMock.ts';
import { UserRatingsResponseMock } from '$mocks/data/users/response/UserRatingsResponseMock.ts';
import { UserStatsResponseMock } from '$mocks/data/users/response/UserStatsResponseMock.ts';
import { UserWatchingResponseMock } from '$mocks/data/users/response/UserWatchingResponseMock.ts';
import { WatchedMoviesResponseMock } from '$mocks/data/users/response/WatchedMoviesResponseMock.ts';
import { WatchedShowsMinimalResponseMock } from '$mocks/data/users/response/WatchedShowsMinimalResponseMock.ts';
import { WatchedShowsResponseMock } from '$mocks/data/users/response/WatchedShowsResponseMock.ts';
import { DROP_URL } from '$mocks/data/users/DROP_URL.ts';
import { DROPPED_URL } from '$mocks/data/users/DROPPED_URL.ts';
import { HISTORY_EPISODES_URL } from '$mocks/data/users/HISTORY_EPISODES_URL.ts';
import { HISTORY_MOVIES_URL } from '$mocks/data/users/HISTORY_MOVIES_URL.ts';
import { HISTORY_SHOWS_URL } from '$mocks/data/users/HISTORY_SHOWS_URL.ts';
import { HISTORY_URL } from '$mocks/data/users/HISTORY_URL.ts';
import { LISTS_URL } from '$mocks/data/users/LISTS_URL.ts';
import { RESTORE_URL } from '$mocks/data/users/RESTORE_URL.ts';
import { USER_FAVORITES_URL } from '$mocks/data/users/USER_FAVORITES_URL.ts';
import { USER_RATINGS_URL } from '$mocks/data/users/USER_RATINGS_URL.ts';
import { USER_SETTINGS_URL } from '$mocks/data/users/USER_SETTINGS_URL.ts';
import { USER_STATS_URL } from '$mocks/data/users/USER_STATS_URL.ts';
import { USER_WATCHLIST_URL } from '$mocks/data/users/USER_WATCHLIST_URL.ts';
import { WATCHED_MOVIES_URL } from '$mocks/data/users/WATCHED_MOVIES_URL.ts';
import { WATCHED_SHOWS_URL } from '$mocks/data/users/WATCHED_SHOWS_URL.ts';

export const users = [
  http.get(USER_SETTINGS_URL, () => {
    return HttpResponse.json(ExtendedUserSettingsResponseMock);
  }),
  http.get(USER_STATS_URL, () => {
    return HttpResponse.json(UserStatsResponseMock);
  }),
  http.get(
    `http://localhost/users/${
      assertDefined(ExtendedUserProfileHarryResponseMock.ids.slug)
    }`,
    () => {
      return HttpResponse.json(ExtendedUserProfileHarryResponseMock);
    },
  ),
  http.get(
    DROPPED_URL,
    () =>
      HttpResponse.json(DroppedShowsResponseMock, {
        headers: pageHeaders(),
      }),
  ),
  http.post(
    DROP_URL,
    () => HttpResponse.json(DropShowResponseMock, { status: 201 }),
  ),
  http.post(
    RESTORE_URL,
    () => HttpResponse.json(RestoreShowResponseMock, { status: 200 }),
  ),
  http.get('http://localhost/users/hidden/progress_watched_reset*', () => {
    return HttpResponse.json(RewatchingShowsResponseMock);
  }),
  http.get('http://localhost/users/hidden/progress_watched*', () => {
    return HttpResponse.json(HiddenShowProgressResponseMock);
  }),
  http.get(WATCHED_SHOWS_URL, (response) => {
    const { searchParams } = new URL(response.request.url);
    const extended = searchParams.get('extended');
    const page = Number(searchParams.get('page') ?? 1);

    if (page > 1) {
      return HttpResponse.json({});
    }

    return HttpResponse.json(
      extended === 'min'
        ? WatchedShowsMinimalResponseMock
        : WatchedShowsResponseMock,
    );
  }),
  http.get(WATCHED_MOVIES_URL, (response) => {
    const { searchParams } = new URL(response.request.url);
    const page = Number(searchParams.get('page') ?? 1);

    if (page > 1) {
      return HttpResponse.json({});
    }

    return HttpResponse.json(WatchedMoviesResponseMock);
  }),
  http.get(USER_WATCHLIST_URL, ({ params, request }) => {
    const page = Number(new URL(request.url).searchParams.get('page') ?? 1);

    if (page > 1) {
      return HttpResponse.json([], { headers: pageHeaders() });
    }

    const listed = LIST_TYPES.watchlist.find((type) =>
      toListTypeSegment(type) === params.type
    );

    return HttpResponse.json(
      WatchlistPreviewResponseMock.filter((item) =>
        params.type === 'all' || item.type === listed
      ),
      { headers: pageHeaders() },
    );
  }),
  // Before the seasons glob below, which would answer a typed seasons read too.
  http.get(USER_RATINGS_URL, ({ params }) => {
    const ratings = String(params.rating).split(',');

    return HttpResponse.json(
      UserRatingsResponseMock.filter(({ type, rating }) =>
        (params.type === 'all' || params.type === toListTypeSegment(type)) &&
        ratings.includes(String(rating))
      ),
      { headers: pageHeaders() },
    );
  }),
  http.get('http://localhost/users/me/ratings/movies', () => {
    return HttpResponse.json(RatedMoviesResponseMock);
  }),
  http.get('http://localhost/users/me/ratings/shows', () => {
    return HttpResponse.json(RatedShowsResponseMock);
  }),
  http.get('http://localhost/users/me/ratings/seasons*', () => {
    return HttpResponse.json(RatedSeasonsResponseMock);
  }),
  http.get('http://localhost/users/me/ratings/episodes', () => {
    return HttpResponse.json(RatedEpisodesResponseMock);
  }),
  // Before the movies and shows globs below, which would answer it too.
  http.get(USER_FAVORITES_URL, ({ params }) => {
    const favorites = FavoritedMediaResponseMock.filter(({ type }) =>
      params.type === 'all' || params.type === toListTypeSegment(type)
    );

    return HttpResponse.json(favorites, { headers: pageHeaders() });
  }),
  http.get('http://localhost/users/me/favorites/movies*', () => {
    return HttpResponse.json(FavoritedMoviesResponseMock);
  }),
  http.get('http://localhost/users/me/favorites/shows*', () => {
    return HttpResponse.json(FavoritedShowsResponseMock);
  }),
  http.get(
    HISTORY_URL,
    () =>
      HttpResponse.json(ActivityHistoryResponseMock, {
        headers: pageHeaders(),
      }),
  ),
  http.get(HISTORY_SHOWS_URL, () => {
    return HttpResponse.json(ShowActivityHistoryResponseMock, {
      headers: pageHeaders(),
    });
  }),
  http.get(HISTORY_MOVIES_URL, () => {
    return HttpResponse.json(MovieActivityHistoryResponseMock, {
      headers: pageHeaders(),
    });
  }),
  http.get(HISTORY_EPISODES_URL, () => {
    return HttpResponse.json(EpisodeActivityHistoryResponseMock);
  }),
  // Before the broad lists handler below, which would answer it too.
  http.get(
    'http://localhost/users/me/lists/:id/items*',
    () =>
      HttpResponse.json(ListItemIdsResponseMock, {
        headers: pageHeaders(),
      }),
  ),
  http.post(
    'http://localhost/users/me/lists/:id/items',
    () => new HttpResponse(null, { status: 201 }),
  ),
  http.post(
    'http://localhost/users/me/lists/:id/items/remove',
    () => new HttpResponse(null, { status: 200 }),
  ),
  http.get('http://localhost/users/me/lists/collaborations*', () => {
    return HttpResponse.json(CollaborationListsResponseMock);
  }),
  http.get(
    LISTS_URL,
    () =>
      HttpResponse.json(PersonalListsResponseMock, {
        headers: pageHeaders(),
      }),
  ),
  http.get('http://localhost/users/me/watching*', () => {
    return HttpResponse.json(UserWatchingResponseMock);
  }),
  http.get('http://localhost/users/me/mir*', () => {
    return HttpResponse.json(UserMonthInReviewResponseMock);
  }),
  http.get('http://localhost/users/me/following', () => {
    return HttpResponse.json(UserFollowingResponseMock);
  }),
  http.get('http://localhost/users/requests', () => {
    return HttpResponse.json(UserFollowRequestsResponseMock);
  }),
  http.get('http://localhost/users/requests/following', () => {
    return HttpResponse.json(UserPendingFollowsResponseMock);
  }),
  http.post('http://localhost/users/requests/:id', () => {
    return new HttpResponse(null, { status: 200 });
  }),
  http.delete('http://localhost/users/requests/:id', () => {
    return new HttpResponse(null, { status: 204 });
  }),
  http.get(
    `http://localhost/users/${UserProfileHarryMappedMock.slug}/lists/${
      assertDefined(SiloListsMappedMock.at(0)).slug
    }`,
    () => {
      return HttpResponse.json(SiloListsResponseMock.at(0));
    },
  ),
  http.get(
    `http://localhost/users/${UserProfileHarryMappedMock.slug}/lists/${
      assertDefined(SiloListsMappedMock.at(0)).slug
    }/items/movie,show*`,
    () => {
      return HttpResponse.json([
        ...ListedShowsResponseMock,
        ...ListedMoviesResponseMock,
      ]);
    },
  ),
  http.get(
    `http://localhost/users/${UserProfileHarryMappedMock.slug}/lists/${
      assertDefined(SiloListsMappedMock.at(0)).slug
    }/items/show*`,
    (response) => {
      const { searchParams } = new URL(response.request.url);
      const limit = searchParams.get('limit');

      const responseMock = limit === 'all'
        ? AllListedShowsResponseMock
        : ListedShowsResponseMock;

      return HttpResponse.json(responseMock);
    },
  ),
  http.get(
    `http://localhost/users/${UserProfileHarryMappedMock.slug}/lists/${
      assertDefined(HereticListsMappedMock.at(0)).slug
    }/items/movie*`,
    () => {
      return HttpResponse.json(ListedMoviesResponseMock);
    },
  ),
  http.get(
    `http://localhost/users/${UserProfileHarryMappedMock.slug}/following`,
    () => {
      return HttpResponse.json(UserFollowingResponseMock);
    },
  ),
  http.get(
    `http://localhost/users/${UserProfileHarryMappedMock.slug}/followers`,
    () => {
      return HttpResponse.json(UserFollowersResponseMock);
    },
  ),
  http.get('http://localhost/users/me/likes/lists', () => {
    return HttpResponse.json(MinimalLikedListsResponseMock);
  }),
  http.get('http://localhost/users/blocked', () => {
    return HttpResponse.json(UserBlockedResponseMock);
  }),
  http.post('http://localhost/users/:id/block', () => {
    return new HttpResponse(null, { status: 201 });
  }),
  http.delete('http://localhost/users/:id/block', () => {
    return new HttpResponse(null, { status: 204 });
  }),
  http.put('http://localhost/users/set_cover', () => {
    return new HttpResponse(null, { status: 204 });
  }),
];
