import { time } from '$lib/utils/timing/time.ts';
import { MovieHereticMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticMappedMock.ts';
import { MovieHereticRelatedMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticRelatedMappedMock.ts';
import { MovieHereticRelatedResponseMock } from '$mocks/data/summary/movies/heretic/response/MovieHereticRelatedResponseMock.ts';
import { HERETIC_RELATED_URL } from '$mocks/data/movies/HERETIC_RELATED_URL.ts';
import { createTestBedQuery } from '$test/beds/query/createTestBedQuery.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { recordSearches } from '$test/beds/request/recordSearches.ts';
import { describe, expect, it } from 'vitest';
import { movieRelatedQuery } from './movieRelatedQuery.ts';

function readRelated() {
  return runQuery({
    factory: () =>
      createTestBedQuery(
        movieRelatedQuery({ slug: MovieHereticMappedMock.slug }),
      ),
    mapper: (response) => response?.data,
  });
}

describe('movieRelatedQuery', () => {
  it('should query related for Heretic (2024)', async () => {
    expect(await readRelated()).toEqual(MovieHereticRelatedMappedMock);
  });

  it('should ask for the first six with the full summary and images', async () => {
    const searches = recordSearches(
      HERETIC_RELATED_URL,
      MovieHereticRelatedResponseMock,
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
      movieRelatedQuery({ slug: MovieHereticMappedMock.slug }).staleTime,
    ).toBe(time.hours(12));
  });
});
