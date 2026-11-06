import type { RatingFilter } from '$lib/features/media-actions/RATING_VALUES.ts';
import { useRating } from '$lib/features/media-actions/stores/useRating.ts';
import type { RatingsTypeFilter } from '$lib/features/ratings/RATINGS_TYPES.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { MAX_DATE } from '$lib/utils/MAX_DATE.ts';
import { MATRIX } from '$mocks/data/media-actions/MATRIX.ts';
import { UserRatingsMappedMock } from '$mocks/data/users/mapped/UserRatingsMappedMock.ts';
import { RATINGS_PATH } from '$mocks/data/users/RATINGS_PATH.ts';
import { UserRatingsResponseMock } from '$mocks/data/users/response/UserRatingsResponseMock.ts';
import { USER_RATINGS_URL } from '$mocks/data/users/USER_RATINGS_URL.ts';
import { createTestBedInfiniteQuery } from '$test/beds/query/createTestBedInfiniteQuery.ts';
import { observeInvalidation } from '$test/beds/query/observeInvalidation.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { waitForSuccess } from '$test/beds/query/waitForSuccess.ts';
import { captureRequests } from '$test/beds/request/captureRequests.ts';
import { recordSearches } from '$test/beds/request/recordSearches.ts';
import { servePaged } from '$test/beds/request/servePaged.ts';
import { collectStates } from '$test/beds/store/collectStates.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { mapToEntries } from '$test/utils/mapToEntries.ts';
import type { RatedItemResponse } from '@trakt/api';
import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { userRatingsQuery } from './userRatingsQuery.ts';

const ALL_RATINGS = '1,2,3,4,5,6,7,8,9,10';
const HERETIC_ROW = assertDefined(
  UserRatingsResponseMock.find((row) => row.type === 'movie'),
);
const SEASON_ROW = assertDefined(
  UserRatingsResponseMock.find((row) => row.type === 'season'),
);

type ReadParams = {
  type?: RatingsTypeFilter;
  rating?: RatingFilter;
  page?: number;
};

function ratings({ type = 'all', rating = 'all', page }: ReadParams = {}) {
  return userRatingsQuery({ slug: 'me', type, rating, limit: 10, page });
}

function readRatings(params?: ReadParams) {
  return runQuery({
    factory: () => createTestBedInfiniteQuery(ratings(params)),
    mapper: mapToEntries,
  });
}

describe('userRatingsQuery', () => {
  it.each(
    [
      ['all', '8', 'all/8'],
      ['movies', '8', 'movies/8'],
      ['shows', '1', 'shows/1'],
      ['seasons', '10', 'seasons/10'],
      ['episodes', '8', 'episodes/8'],
      ['all', 'all', `all/${ALL_RATINGS}`],
      ['movies', 'all', `movies/${ALL_RATINGS}`],
      ['shows', 'all', `shows/${ALL_RATINGS}`],
      ['seasons', 'all', `seasons/${ALL_RATINGS}`],
      ['episodes', 'all', `episodes/${ALL_RATINGS}`],
    ] as const,
  )(
    'should ask for type %s and rating %s at %s',
    async (type, rating, path) => {
      const requests = await captureRequests(
        () => readRatings({ type, rating }),
        { pathIncludes: RATINGS_PATH },
      );

      expect(requests).toEqual([`GET ${RATINGS_PATH}/${path}`]);
    },
  );

  it('should ask for the page, the limit and the images', async () => {
    const searches = recordSearches(USER_RATINGS_URL, []);

    await readRatings({ page: 3 });

    expect(searches.map((search) => Object.fromEntries(search))).toEqual([
      expect.objectContaining({
        extended: 'full,images',
        limit: '10',
        page: '3',
      }),
    ]);
  });

  it('should map every type of rated item', async () => {
    expect(await readRatings()).toEqual(UserRatingsMappedMock);
  });

  it.each(
    [
      ['movies', 'movie'],
      ['shows', 'show'],
      ['seasons', 'season'],
      ['episodes', 'episode'],
    ] as const,
  )('should map the %s rows', async (type, itemType) => {
    expect(await readRatings({ type })).toEqual(
      UserRatingsMappedMock.filter((entry) => entry.type === itemType),
    );
  });

  it('should read the rows of one rating', async () => {
    expect(await readRatings({ rating: '8' })).toEqual(
      UserRatingsMappedMock.filter(({ rating }) => rating === 8),
    );
  });

  it.each(
    [
      [{ type: 'movies' }, { type: 'shows' }],
      [{ rating: '8' }, { rating: '9' }],
      [{ rating: '8' }, { rating: 'all' }],
      [{ page: 1 }, { page: 2 }],
    ] as const,
  )('should cache %j and %j apart', async (first, second) => {
    const { firstRead, secondRead } = await renderStore(() => ({
      firstRead: createTestBedInfiniteQuery(ratings(first)),
      secondRead: createTestBedInfiniteQuery(ratings(second)),
    }));
    await waitForSuccess(firstRead);

    const requests = await captureRequests(
      () => waitForSuccess(secondRead),
      { pathIncludes: RATINGS_PATH },
    );

    expect(requests).toHaveLength(1);
  });

  it('should read a page past the last as no rows of the last page', async () => {
    servePaged({
      url: USER_RATINGS_URL,
      body: [],
      page: 5,
      pageCount: 2,
      itemCount: 100,
    });

    const result = await runQuery({
      factory: () => createTestBedInfiniteQuery(ratings({ page: 5 })),
      waitFor: ({ isFetched }) => isFetched,
    });

    expect(result.data?.pages).toEqual([{
      entries: [],
      page: { type: 'paginated', current: 2, total: 2, itemCount: 100 },
    }]);
    expect(result.hasNextPage).toBe(false);
  });

  it.each(['soon', null])(
    'should drop a row whose rated_at is %j, keeping the rest',
    async (ratedAt) => {
      servePaged({
        url: USER_RATINGS_URL,
        body: [
          ...UserRatingsResponseMock,
          { ...SEASON_ROW, rated_at: ratedAt },
        ],
      });

      expect(await readRatings()).toEqual(UserRatingsMappedMock);
    },
  );

  it('should read a season with a null air date as aired at no known date', async () => {
    servePaged({
      url: USER_RATINGS_URL,
      body: [{
        ...SEASON_ROW,
        season: { ...SEASON_ROW.season, first_aired: null },
      }],
    });

    expect(await readRatings()).toEqual([
      expect.objectContaining({
        season: expect.objectContaining({ airDate: MAX_DATE }),
      }),
    ]);
  });

  describe('invalidation', () => {
    it.each([
      InvalidateAction.Rated('movie'),
      InvalidateAction.Rated('show'),
      InvalidateAction.Rated('season'),
      InvalidateAction.Rated('episode'),
    ])('should refetch on %s', async (action) => {
      const invalidate = await observeInvalidation(() =>
        createTestBedInfiniteQuery(ratings({ type: 'movies', rating: '8' }))
      );

      expect(await invalidate(action)).toEqual([
        `GET ${RATINGS_PATH}/movies/8`,
      ]);
    });

    it('should refetch the ratings page when useRating rates a title', async () => {
      const rows: RatedItemResponse[] = [HERETIC_ROW];
      servePaged({ url: USER_RATINGS_URL, body: rows });
      const { rate, page } = await renderStore(() => ({
        ...useRating(MATRIX),
        page: createTestBedInfiniteQuery(ratings()),
      }));
      collectStates(page);
      await waitForSuccess(page);

      rows.push(SEASON_ROW);
      await rate(8);

      expect(mapToEntries(await firstValueFrom(page))).toEqual(
        UserRatingsMappedMock.filter(({ type }) =>
          type === 'movie' || type === 'season'
        ),
      );
    });
  });
});
