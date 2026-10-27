import { createTestBedQuery } from '$test/beds/query/createTestBedQuery.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { recordSearches } from '$test/beds/request/recordSearches.ts';
import { SILO_SUMMARY_URL } from '$mocks/data/shows/SILO_SUMMARY_URL.ts';
import { ShowSiloResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloResponseMock.ts';
import { server } from '$mocks/server.ts';
import { http, HttpResponse } from 'msw';
import { setToken } from '$lib/features/auth/token.ts';
import { describe, expect, it, onTestFinished } from 'vitest';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { showSummaryQuery } from './showSummaryQuery.ts';

describe('showSummaryQuery', () => {
  it('should query for Silo (2023)', async () => {
    const result = await runQuery({
      factory: () =>
        createTestBedQuery(showSummaryQuery({ slug: ShowSiloMappedMock.slug })),
      mapper: (response) => response?.data,
    });

    expect(result).to.deep.equal(ShowSiloMappedMock);
  });

  it('should ask for the full summary with images only', async () => {
    const searches = recordSearches(SILO_SUMMARY_URL, ShowSiloResponseMock);

    await runQuery({
      factory: () =>
        createTestBedQuery(showSummaryQuery({ slug: ShowSiloMappedMock.slug })),
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
      http.get(SILO_SUMMARY_URL, ({ request }) => {
        authorization.push(request.headers.get('authorization'));
        return HttpResponse.json(ShowSiloResponseMock);
      }),
    );

    await runQuery({
      factory: () =>
        createTestBedQuery(showSummaryQuery({ slug: ShowSiloMappedMock.slug })),
      mapper: (response) => response?.data,
    });

    expect(authorization).toEqual([null]);
  });
});
