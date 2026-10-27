import { MovieHereticMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticMappedMock.ts';
import { createTestBedQuery } from '$test/beds/query/createTestBedQuery.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { recordSearches } from '$test/beds/request/recordSearches.ts';
import { HERETIC_SUMMARY_URL } from '$mocks/data/movies/HERETIC_SUMMARY_URL.ts';
import { MovieHereticResponseMock } from '$mocks/data/summary/movies/heretic/response/MovieHereticResponseMock.ts';
import { server } from '$mocks/server.ts';
import { http, HttpResponse } from 'msw';
import { setToken } from '$lib/features/auth/token.ts';
import { describe, expect, it, onTestFinished } from 'vitest';
import { movieSummaryQuery } from './movieSummaryQuery.ts';

describe('movieSummaryQuery', () => {
  it('should query for Heretic (2024)', async () => {
    const result = await runQuery({
      factory: () =>
        createTestBedQuery(
          movieSummaryQuery({ slug: MovieHereticMappedMock.slug }),
        ),
      mapper: (response) => response?.data,
    });

    expect(result).to.deep.equal(MovieHereticMappedMock);
  });

  it('should ask for the full summary with images only', async () => {
    const searches = recordSearches(
      HERETIC_SUMMARY_URL,
      MovieHereticResponseMock,
    );

    await runQuery({
      factory: () =>
        createTestBedQuery(
          movieSummaryQuery({ slug: MovieHereticMappedMock.slug }),
        ),
      mapper: (response) => response?.data,
    });

    expect(searches.map((search) => search.get('extended'))).toEqual([
      'full,images',
    ]);
  });

  it('should send no Bearer token, even when signed in', async () => {
    setToken({ value: 'signed-in' });
    onTestFinished(() => setToken(null));
    const authorization: Array<string | null> = [];
    server.use(
      http.get(HERETIC_SUMMARY_URL, ({ request }) => {
        authorization.push(request.headers.get('authorization'));
        return HttpResponse.json(MovieHereticResponseMock);
      }),
    );

    await runQuery({
      factory: () =>
        createTestBedQuery(
          movieSummaryQuery({ slug: MovieHereticMappedMock.slug }),
        ),
      mapper: (response) => response?.data,
    });

    expect(authorization).toEqual([null]);
  });
});
