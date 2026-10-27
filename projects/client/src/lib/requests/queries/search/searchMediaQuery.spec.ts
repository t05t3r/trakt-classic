import { SearchMediaMappedMock } from '$mocks/data/search/mapped/SearchMediaMappedMock.ts';
import { MovieHereticResponseMock } from '$mocks/data/summary/movies/heretic/response/MovieHereticResponseMock.ts';
import { createTestBedQuery } from '$test/beds/query/createTestBedQuery.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { describe, expect, it } from 'vitest';
import { searchMediaQuery } from './searchMediaQuery.ts';

describe('searchMediaQuery', () => {
  // TODO figure out abortsignal issue
  it.skip('should query for searched items', async () => {
    const result = await runQuery({
      factory: () =>
        createTestBedQuery(
          searchMediaQuery({
            query: MovieHereticResponseMock.title,
            limit: 50,
          }),
        ),
      mapper: (response) => response?.data,
    });

    expect(result).to.deep.equal(SearchMediaMappedMock);
  });
});
