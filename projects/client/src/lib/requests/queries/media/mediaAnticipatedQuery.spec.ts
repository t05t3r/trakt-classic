import { MoviesAnticipatedMappedMock } from '$mocks/data/movies/mapped/MoviesAnticipatedMappedMock.ts';
import { MoviesAnticipatedResponseMock } from '$mocks/data/movies/response/MoviesAnticipatedResponseMock.ts';
import { ShowsAnticipatedMappedMock } from '$mocks/data/shows/mapped/ShowsAnticipatedMappedMock.ts';
import { ShowsAnticipatedResponseMock } from '$mocks/data/shows/response/ShowsAnticipatedResponseMock.ts';
import { server } from '$mocks/server.ts';
import { createTestBedInfiniteQuery } from '$test/beds/query/createTestBedInfiniteQuery.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { mapToEntries } from '$test/utils/mapToEntries.ts';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { mediaAnticipatedQuery } from './mediaAnticipatedQuery.ts';

function readMediaAnticipated(body: ReadonlyArray<unknown>) {
  server.use(
    http.get(
      'http://localhost/media/anticipated',
      () => HttpResponse.json(body),
    ),
  );

  return runQuery({
    factory: () =>
      createTestBedInfiniteQuery(mediaAnticipatedQuery({ limit: 10 })),
    mapper: mapToEntries,
  });
}

describe('mediaAnticipatedQuery', () => {
  it('should map movies and shows', async () => {
    const result = await readMediaAnticipated([
      ...MoviesAnticipatedResponseMock,
      ...ShowsAnticipatedResponseMock,
    ]);

    expect(result).toEqual([
      ...MoviesAnticipatedMappedMock,
      ...ShowsAnticipatedMappedMock,
    ]);
  });

  it('should drop an entry with neither a movie nor a show', async () => {
    const result = await readMediaAnticipated([{ list_count: 3 }]);

    expect(result).toEqual([]);
  });
});
