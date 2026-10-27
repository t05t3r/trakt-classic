import { setToken } from '$lib/features/auth/token.ts';
import { SILO_EPISODE_SUMMARY_URL } from '$mocks/data/shows/SILO_EPISODE_SUMMARY_URL.ts';
import { EpisodeSiloResponseMock } from '$mocks/data/summary/episodes/silo/response/EpisodeSiloResponseMock.ts';
import { ShowSiloResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloResponseMock.ts';
import { server } from '$mocks/server.ts';
import { captureRequests } from '$test/beds/request/captureRequests.ts';
import { createTestBedQuery } from '$test/beds/query/createTestBedQuery.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, onTestFinished } from 'vitest';
import { EpisodeSiloMappedMock } from '$mocks/data/summary/episodes/silo/mapped/EpisodeSiloMappedMock.ts';
import { episodeSummaryQuery } from './episodeSummaryQuery.ts';

const EPISODE_ZERO_PATH =
  `/shows/${ShowSiloResponseMock.ids.slug}/seasons/${EpisodeSiloResponseMock.season}/episodes/0`;

const runSiloEpisode = (episode = EpisodeSiloResponseMock.number) =>
  runQuery({
    factory: () =>
      createTestBedQuery(
        episodeSummaryQuery({
          slug: ShowSiloResponseMock.ids.slug,
          season: EpisodeSiloResponseMock.season,
          episode,
        }),
      ),
    mapper: (response) => response?.data,
  });

describe('episodeSummaryQuery', () => {
  it('should query for episode summary', async () => {
    expect(await runSiloEpisode()).to.deep.equal(EpisodeSiloMappedMock);
  });

  it('should send no Bearer token, even when signed in', async () => {
    setToken({ value: 'signed-in' });
    onTestFinished(() => setToken(null));
    const authorization: Array<string | null> = [];
    server.use(
      http.get(SILO_EPISODE_SUMMARY_URL, ({ request }) => {
        authorization.push(request.headers.get('authorization'));
        return HttpResponse.json(EpisodeSiloResponseMock);
      }),
    );

    await runSiloEpisode();

    expect(authorization).toEqual([null]);
  });

  it('should keep an episode 0 in the request path', async () => {
    server.use(
      http.get(
        `http://localhost${EPISODE_ZERO_PATH}`,
        () => HttpResponse.json({ ...EpisodeSiloResponseMock, number: 0 }),
      ),
    );

    const requests = await captureRequests(() => runSiloEpisode(0));

    expect(requests.filter((request) => request.startsWith('GET /shows/')))
      .toEqual([`GET ${EPISODE_ZERO_PATH}`]);
  });
});
