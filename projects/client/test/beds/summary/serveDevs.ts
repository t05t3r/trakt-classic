import { DEVS_SUMMARY_URL } from '$mocks/data/shows/DEVS_SUMMARY_URL.ts';
import { ShowDevsSeasonEpisodesResponseMock } from '$mocks/data/summary/shows/devs/response/ShowDevsSeasonEpisodesResponseMock.ts';
import { server } from '$mocks/server.ts';
import { notFound } from '$test/beds/request/notFound.ts';
import type { SeasonsResponse } from '@trakt/api';
import { http, HttpResponse } from 'msw';

// Listed first, so they win over the catch-all that fails every other Devs request.
export function serveDevs(seasons: SeasonsResponse): void {
  server.use(
    http.get(`${DEVS_SUMMARY_URL}/seasons`, () => HttpResponse.json(seasons)),
    http.get(
      `${DEVS_SUMMARY_URL}/seasons/1`,
      () => HttpResponse.json(ShowDevsSeasonEpisodesResponseMock),
    ),
    http.get(`${DEVS_SUMMARY_URL}*`, notFound),
  );
}
