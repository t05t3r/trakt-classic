import { SILO_LAST_EPISODE_URL } from '$mocks/data/shows/SILO_LAST_EPISODE_URL.ts';
import { ShowSiloLastEpisodeMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloLastEpisodeMappedMock.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { ShowSiloLastEpisodeResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloLastEpisodeResponseMock.ts';
import { server } from '$mocks/server.ts';
import { createTestBedQuery } from '$test/beds/query/createTestBedQuery.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { recordSearches } from '$test/beds/request/recordSearches.ts';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { showLastEpisodeQuery } from './showLastEpisodeQuery.ts';

function readLastEpisode() {
  return runQuery({
    factory: () =>
      createTestBedQuery(
        showLastEpisodeQuery({ slug: ShowSiloMappedMock.slug }),
      ),
    waitFor: (result) => result.isFetched,
  }).then((result) => result.data);
}

describe('showLastEpisodeQuery', () => {
  it('should query the last aired episode of Silo (2023)', async () => {
    expect(await readLastEpisode()).toEqual(ShowSiloLastEpisodeMappedMock);
  });

  it('should read null when nothing has aired', async () => {
    server.use(
      http.get(
        SILO_LAST_EPISODE_URL,
        () => new HttpResponse(null, { status: 204 }),
      ),
    );

    expect(await readLastEpisode()).toBeNull();
  });

  it('should ask for the full episode with images', async () => {
    const searches = recordSearches(
      SILO_LAST_EPISODE_URL,
      ShowSiloLastEpisodeResponseMock,
    );

    await readLastEpisode();

    expect(searches.map((search) => search.get('extended'))).toEqual([
      'full,images',
    ]);
  });
});
