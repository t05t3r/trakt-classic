import { SILO_SEASONS_URL } from '$mocks/data/shows/SILO_SEASONS_URL.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { ShowSiloSeasonFourMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloSeasonFourMappedMock.ts';
import { ShowSiloSeasonsMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloSeasonsMappedMock.ts';
import { ShowSiloSeasonFourResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloSeasonFourResponseMock.ts';
import { ShowSiloSeasonsResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloSeasonsResponseMock.ts';
import { server } from '$mocks/server.ts';
import { createTestBedQuery } from '$test/beds/query/createTestBedQuery.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { showSeasonsQuery } from './showSeasonsQuery.ts';

function readSiloSeasons() {
  return runQuery({
    factory: () =>
      createTestBedQuery(
        showSeasonsQuery({ slug: ShowSiloMappedMock.slug }),
      ),
    mapper: (response) => response?.data,
  });
}

describe('showSeasonsQuery', () => {
  it('should query seasons for Silo (2023)', async () => {
    expect(await readSiloSeasons()).to.deep.equal(ShowSiloSeasonsMappedMock);
  });

  it('should keep a season with no episodes yet', async () => {
    server.use(
      http.get(SILO_SEASONS_URL, () =>
        HttpResponse.json([
          ...ShowSiloSeasonsResponseMock,
          ShowSiloSeasonFourResponseMock,
        ])),
    );

    expect(await readSiloSeasons()).to.deep.equal([
      ...ShowSiloSeasonsMappedMock,
      ShowSiloSeasonFourMappedMock,
    ]);
  });
});
