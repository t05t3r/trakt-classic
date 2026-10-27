import { HERETIC_OFFICIAL_LISTS_URL } from '$mocks/data/movies/HERETIC_OFFICIAL_LISTS_URL.ts';
import { OfficialListsMappedMock } from '$mocks/data/lists/mapped/OfficialListsMappedMock.ts';
import { OfficialListsResponseMock } from '$mocks/data/lists/response/OfficialListsResponseMock.ts';
import { MovieHereticMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticMappedMock.ts';
import { server } from '$mocks/server.ts';
import { createTestBedQuery } from '$test/beds/query/createTestBedQuery.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { recordSearches } from '$test/beds/request/recordSearches.ts';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { movieOfficialListQuery } from './movieOfficialListQuery.ts';

const readOfficialList = () =>
  runQuery({
    factory: () =>
      createTestBedQuery(
        movieOfficialListQuery({ slug: MovieHereticMappedMock.slug }),
      ),
    mapper: (response) => response?.data,
    waitFor: (list) => list !== undefined,
  });

describe('movieOfficialListQuery', () => {
  it("should read Heretic (2024)'s most popular official list", async () => {
    expect(await readOfficialList()).toEqual(OfficialListsMappedMock.at(0));
  });

  it('should ask for the first official list only', async () => {
    const searches = recordSearches(
      HERETIC_OFFICIAL_LISTS_URL,
      OfficialListsResponseMock,
    );

    await readOfficialList();

    expect(searches.map((search) => Object.fromEntries(search))).toEqual([
      expect.objectContaining({ page: '1', limit: '1' }),
    ]);
  });

  it('should read null for a movie in no official list', async () => {
    server.use(
      http.get(HERETIC_OFFICIAL_LISTS_URL, () => HttpResponse.json([])),
    );

    expect(await readOfficialList()).toBeNull();
  });
});
