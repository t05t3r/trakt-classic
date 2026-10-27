import { time } from '$lib/utils/timing/time.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { ShowSiloRelatedMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloRelatedMappedMock.ts';
import { ShowSiloRelatedResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloRelatedResponseMock.ts';
import { SILO_RELATED_URL } from '$mocks/data/shows/SILO_RELATED_URL.ts';
import { createTestBedQuery } from '$test/beds/query/createTestBedQuery.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { recordSearches } from '$test/beds/request/recordSearches.ts';
import { describe, expect, it } from 'vitest';
import { showRelatedQuery } from './showRelatedQuery.ts';

function readRelated() {
  return runQuery({
    factory: () =>
      createTestBedQuery(
        showRelatedQuery({ slug: ShowSiloMappedMock.slug }),
      ),
    mapper: (response) => response?.data,
  });
}

describe('showRelatedQuery', () => {
  it('should query related for Silo (2023)', async () => {
    expect(await readRelated()).toEqual(ShowSiloRelatedMappedMock);
  });

  it('should ask for the first six with the full summary and images', async () => {
    const searches = recordSearches(
      SILO_RELATED_URL,
      ShowSiloRelatedResponseMock,
    );

    await readRelated();

    // Every GET also carries the query's invalidation `marker`.
    expect(searches.map((search) => Object.fromEntries(search))).toEqual([
      expect.objectContaining({
        extended: 'full,images',
        limit: '6',
        page: '1',
      }),
    ]);
  });

  it('should keep its data fresh for 12 hours', () => {
    expect(
      showRelatedQuery({ slug: ShowSiloMappedMock.slug }).staleTime,
    ).toBe(time.hours(12));
  });
});
