import { RecommendedShowsMappedMock } from '$mocks/data/recommendations/mapped/RecommendedShowsMappedMock.ts';
import { RecommendedShowsResponseMock } from '$mocks/data/recommendations/response/RecommendedShowsResponseMock.ts';
import { RECOMMENDED_SHOWS_URL } from '$mocks/data/recommendations/RECOMMENDED_SHOWS_URL.ts';
import { server } from '$mocks/server.ts';
import { createTestBedQuery } from '$test/beds/query/createTestBedQuery.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { recordSearches } from '$test/beds/request/recordSearches.ts';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { recommendedShowsQuery } from './recommendedShowsQuery.ts';

describe('recommendedShowsQuery', () => {
  it('should query recommended shows', async () => {
    const result = await runQuery({
      factory: () =>
        createTestBedQuery(
          recommendedShowsQuery(),
        ),
      mapper: (response) => response?.data,
    });

    expect(result).to.deep.equal(RecommendedShowsMappedMock);
  });

  it('should ask for full items with images, leaving the watchlisted out', async () => {
    const searches = recordSearches(
      RECOMMENDED_SHOWS_URL,
      RecommendedShowsResponseMock,
    );

    await runQuery({
      factory: () => createTestBedQuery(recommendedShowsQuery({ limit: 12 })),
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
      RECOMMENDED_SHOWS_URL,
      RecommendedShowsResponseMock,
    );

    await runQuery({
      factory: () =>
        createTestBedQuery(
          recommendedShowsQuery({
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
        RECOMMENDED_SHOWS_URL,
        () => new HttpResponse(null, { status: 500 }),
      ),
    );

    const result = await runQuery({
      factory: () => createTestBedQuery(recommendedShowsQuery({ limit: 12 })),
      waitFor: (result) => result.isError,
    });

    expect(result.error).toMatchObject({ detail: { status: 500 } });
  });
});
