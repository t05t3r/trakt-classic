import { RecommendedMoviesMappedMock } from '$mocks/data/recommendations/mapped/RecommendedMoviesMappedMock.ts';
import { RecommendedMoviesResponseMock } from '$mocks/data/recommendations/response/RecommendedMoviesResponseMock.ts';
import { RECOMMENDED_MOVIES_URL } from '$mocks/data/recommendations/RECOMMENDED_MOVIES_URL.ts';
import { server } from '$mocks/server.ts';
import { createTestBedQuery } from '$test/beds/query/createTestBedQuery.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { recordSearches } from '$test/beds/request/recordSearches.ts';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { recommendedMoviesQuery } from './recommendedMoviesQuery.ts';

describe('recommendedMoviesQuery', () => {
  it('should query recommended movies', async () => {
    const result = await runQuery({
      factory: () =>
        createTestBedQuery(
          recommendedMoviesQuery(),
        ),
      mapper: (response) => response?.data,
    });

    expect(result).to.deep.equal(RecommendedMoviesMappedMock);
  });

  it('should ask for full items with images, leaving the watchlisted out', async () => {
    const searches = recordSearches(
      RECOMMENDED_MOVIES_URL,
      RecommendedMoviesResponseMock,
    );

    await runQuery({
      factory: () => createTestBedQuery(recommendedMoviesQuery({ limit: 12 })),
      waitFor: (result) => result.isSuccess,
    });

    const params = searches.at(-1);
    expect(params?.get('extended')).toBe('full,images');
    expect(params?.get('limit')).toBe('12');
    expect(params?.get('ignore_watchlisted')).toBe('true');
    expect(params?.has('ignore_collected')).toBe(false);
    expect(params?.has('ignore_watched')).toBe(false);
  });

  it('should leave the watchlisted out even when a filter keeps them', async () => {
    const searches = recordSearches(
      RECOMMENDED_MOVIES_URL,
      RecommendedMoviesResponseMock,
    );

    await runQuery({
      factory: () =>
        createTestBedQuery(
          recommendedMoviesQuery({
            limit: 12,
            filter: { ignore_watchlisted: false },
          }),
        ),
      waitFor: (result) => result.isSuccess,
    });

    expect(searches.at(-1)?.getAll('ignore_watchlisted'))
      .toEqual(['true']);
  });

  it('should fail with the status of a failed response', async () => {
    server.use(
      http.get(
        RECOMMENDED_MOVIES_URL,
        () => new HttpResponse(null, { status: 500 }),
      ),
    );

    const result = await runQuery({
      factory: () => createTestBedQuery(recommendedMoviesQuery({ limit: 12 })),
      waitFor: (result) => result.isError,
    });

    expect(result.error).toMatchObject({ detail: { status: 500 } });
  });
});
