import { FavoritedMoviesMappedMock } from '$mocks/data/users/mapped/FavoritedMoviesMappedMock.ts';
import { FavoritedShowsMappedMock } from '$mocks/data/users/mapped/FavoritedShowsMappedMock.ts';
import { FavoritedMoviesResponseMock } from '$mocks/data/users/response/FavoritedMoviesResponseMock.ts';
import { FAVORITES_SEGMENTS } from '$mocks/data/users/FAVORITES_SEGMENTS.ts';
import { USER_FAVORITES_URL } from '$mocks/data/users/USER_FAVORITES_URL.ts';
import { createTestBedInfiniteQuery } from '$test/beds/query/createTestBedInfiniteQuery.ts';
import {
  describeListReadQuery,
  type ListReadParams,
} from '$test/beds/query/describeListReadQuery.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { captureRequests } from '$test/beds/request/captureRequests.ts';
import { mapToEntries } from '$test/utils/mapToEntries.ts';
import { describe, expect, it } from 'vitest';
import {
  type FavoritesType,
  mediaFavoritesQuery,
} from './mediaFavoritesQuery.ts';

function favorites({ genres, ...params }: ListReadParams<FavoritesType>) {
  return mediaFavoritesQuery({ slug: 'me', ...params, filter: { genres } });
}

function readFavorites(params: ListReadParams<FavoritesType> = {}) {
  return runQuery({
    factory: () => createTestBedInfiniteQuery(favorites(params)),
    mapper: mapToEntries,
  });
}

describeListReadQuery({
  name: 'mediaFavoritesQuery',
  list: 'favorites',
  segments: FAVORITES_SEGMENTS,
  query: favorites,
  url: USER_FAVORITES_URL,
  response: FavoritedMoviesResponseMock,
});

describe('mediaFavoritesQuery', () => {
  it('should ask for every favorite by rank ascending by default', async () => {
    const requests = await captureRequests(() => readFavorites(), {
      pathIncludes: '/favorites/',
    });

    expect(requests).toEqual(['GET /users/me/favorites/all/rank/asc']);
  });

  it('should map favorite movies and shows', async () => {
    expect(await readFavorites()).toEqual([
      ...FavoritedMoviesMappedMock,
      ...FavoritedShowsMappedMock,
    ]);
  });

  it.each(
    [
      ['movies', FavoritedMoviesMappedMock],
      ['shows', FavoritedShowsMappedMock],
    ] as const,
  )('should map the %s favorites', async (type, mapped) => {
    expect(await readFavorites({ type })).toEqual(mapped);
  });
});
