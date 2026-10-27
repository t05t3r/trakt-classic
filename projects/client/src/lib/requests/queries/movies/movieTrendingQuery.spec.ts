import { MoviesTrendingMappedMock } from '$mocks/data/movies/mapped/MoviesTrendingMappedMock.ts';
import { MoviesTrendingResponseMock } from '$mocks/data/movies/response/MoviesTrendingResponseMock.ts';
import { createTestBedInfiniteQuery } from '$test/beds/query/createTestBedInfiniteQuery.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { recordSearches } from '$test/beds/request/recordSearches.ts';
import { mapToEntries } from '$test/utils/mapToEntries.ts';
import { describe, expect, it } from 'vitest';
import { movieTrendingQuery } from './movieTrendingQuery.ts';

describe('movieTrendingQuery', () => {
  it('should send parental guidance ranges to the API unchanged', async () => {
    const filter = {
      parental_nudity: '0-0',
      parental_violence: '0-1',
      parental_profanity: '1-2',
      parental_alcohol: '2-3',
      parental_frightening: '3-3',
    };
    const searches = recordSearches(
      'http://localhost/movies/trending',
      MoviesTrendingResponseMock,
    );

    await runQuery({
      factory: () =>
        createTestBedInfiniteQuery(
          movieTrendingQuery({ filter, limit: 10 }),
        ),
      mapper: mapToEntries,
    });

    Object.entries(filter).forEach(([key, value]) => {
      expect(searches.at(-1)?.get(key)).toBe(value);
    });
  });

  it('should query trending movies', async () => {
    const result = await runQuery({
      factory: () =>
        createTestBedInfiniteQuery(
          movieTrendingQuery(),
        ),
      mapper: mapToEntries,
    });

    expect(result).to.deep.equal(MoviesTrendingMappedMock);
  });
});
