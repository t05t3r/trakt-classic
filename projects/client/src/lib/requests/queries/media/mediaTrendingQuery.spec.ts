import { MoviesTrendingMappedMock } from '$mocks/data/movies/mapped/MoviesTrendingMappedMock.ts';
import { MoviesTrendingResponseMock } from '$mocks/data/movies/response/MoviesTrendingResponseMock.ts';
import { ShowsTrendingMappedMock } from '$mocks/data/shows/mapped/ShowsTrendingMappedMock.ts';
import { ShowsTrendingResponseMock } from '$mocks/data/shows/response/ShowsTrendingResponseMock.ts';
import { server } from '$mocks/server.ts';
import { createTestBedInfiniteQuery } from '$test/beds/query/createTestBedInfiniteQuery.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { mapToEntries } from '$test/utils/mapToEntries.ts';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { mediaTrendingQuery } from './mediaTrendingQuery.ts';

function readMediaTrending(body: ReadonlyArray<unknown>) {
  server.use(
    http.get('http://localhost/media/trending', () => HttpResponse.json(body)),
  );

  return runQuery({
    factory: () =>
      createTestBedInfiniteQuery(mediaTrendingQuery({ limit: 10 })),
    mapper: mapToEntries,
  });
}

describe('mediaTrendingQuery', () => {
  it('should map movies and shows', async () => {
    const result = await readMediaTrending([
      ...MoviesTrendingResponseMock,
      ...ShowsTrendingResponseMock,
    ]);

    expect(result).toEqual([
      ...MoviesTrendingMappedMock,
      ...ShowsTrendingMappedMock,
    ]);
  });

  it('should drop an entry with neither a movie nor a show', async () => {
    const result = await readMediaTrending([{ watchers: 3 }]);

    expect(result).toEqual([]);
  });
});
