import { SILO_SEASONS_URL } from '$mocks/data/shows/SILO_SEASONS_URL.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { ShowSiloSeasonFourMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloSeasonFourMappedMock.ts';
import { ShowSiloSeasonsMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloSeasonsMappedMock.ts';
import { ShowSiloSeasonFourResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloSeasonFourResponseMock.ts';
import { ShowSiloSeasonsResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloSeasonsResponseMock.ts';
import { server } from '$mocks/server.ts';
import { useQuery } from '$lib/features/query/useQuery.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { captureRequests } from '$test/beds/request/captureRequests.ts';
import { readSettled } from '$test/beds/store/readSettled.ts';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
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

  describe('disabled', () => {
    const siloSeasons = (enabled?: boolean) =>
      useQuery(showSeasonsQuery({ slug: ShowSiloMappedMock.slug, enabled }))
        .pipe(map(({ data }) => data));

    it('should send no request', async () => {
      const requests = await captureRequests(async () => {
        await readSettled(() => siloSeasons(false));
        await waitNegativeClaim();
      }, { pathIncludes: '/seasons' });

      expect(requests).toEqual([]);
    });

    it('should read the entry an enabled read of the show cached', async () => {
      const read = await readSettled(() =>
        combineLatest([siloSeasons(), siloSeasons(false)]).pipe(
          map(([, disabled]) => disabled),
        )
      );

      expect(read).toEqual(ShowSiloSeasonsMappedMock);
    });
  });
});
