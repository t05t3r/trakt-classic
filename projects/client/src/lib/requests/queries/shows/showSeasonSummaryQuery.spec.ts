import { SPECIALS } from '$lib/utils/media/SPECIALS.ts';
import { setToken } from '$lib/features/auth/token.ts';
import { SILO_MISSING_SEASON } from '$mocks/data/shows/SILO_MISSING_SEASON.ts';
import { SILO_SEASON_SUMMARY_URL } from '$mocks/data/shows/SILO_SEASON_SUMMARY_URL.ts';
import { SeasonSiloMappedMock } from '$mocks/data/summary/seasons/silo/mapped/SeasonSiloMappedMock.ts';
import { SeasonSiloResponseMock } from '$mocks/data/summary/seasons/silo/response/SeasonSiloResponseMock.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { server } from '$mocks/server.ts';
import { captureRequests } from '$test/beds/request/captureRequests.ts';
import { createTestBedQuery } from '$test/beds/query/createTestBedQuery.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { recordSearches } from '$test/beds/request/recordSearches.ts';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, onTestFinished } from 'vitest';
import { showSeasonSummaryQuery } from './showSeasonSummaryQuery.ts';

const SPECIALS_PATH =
  `/shows/${ShowSiloMappedMock.slug}/seasons/${SPECIALS}/info`;

const readSiloSeason = (season = SeasonSiloMappedMock.number) =>
  runQuery({
    factory: () =>
      createTestBedQuery(
        showSeasonSummaryQuery({ slug: ShowSiloMappedMock.slug, season }),
      ),
    waitFor: (result) => result.isFetched,
  }).then((result) => result.data);

describe('showSeasonSummaryQuery', () => {
  it('should query the summary of Silo season 1', async () => {
    expect(await readSiloSeason()).toEqual(SeasonSiloMappedMock);
  });

  it('should read null for a season the show does not have', async () => {
    expect(await readSiloSeason(SILO_MISSING_SEASON)).toBeNull();
  });

  it('should ask for the full season with images', async () => {
    const searches = recordSearches(
      SILO_SEASON_SUMMARY_URL,
      SeasonSiloResponseMock,
    );

    await readSiloSeason();

    expect(searches.map((search) => search.get('extended'))).toEqual([
      'full,images',
    ]);
  });

  it('should send no Bearer token, even when signed in', async () => {
    setToken({ value: 'signed-in' });
    onTestFinished(() => setToken(null));
    const authorization: Array<string | null> = [];
    server.use(
      http.get(SILO_SEASON_SUMMARY_URL, ({ request }) => {
        authorization.push(request.headers.get('authorization'));
        return HttpResponse.json(SeasonSiloResponseMock);
      }),
    );

    await readSiloSeason();

    expect(authorization).toEqual([null]);
  });

  it('should keep a season 0 in the request path', async () => {
    server.use(
      http.get(
        `http://localhost${SPECIALS_PATH}`,
        () =>
          HttpResponse.json({ ...SeasonSiloResponseMock, number: SPECIALS }),
      ),
    );

    const requests = await captureRequests(() => readSiloSeason(SPECIALS));

    expect(requests.filter((request) => request.startsWith('GET /shows/')))
      .toEqual([`GET ${SPECIALS_PATH}`]);
  });
});
