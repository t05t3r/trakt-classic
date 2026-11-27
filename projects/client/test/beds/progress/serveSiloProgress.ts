import { SILO_PROGRESS_URL } from '$mocks/data/shows/SILO_PROGRESS_URL.ts';
import { server } from '$mocks/server.ts';
import type { ShowProgressResponse } from '@trakt/api';
import { http, HttpResponse } from 'msw';

export function serveSiloProgress(progress: ShowProgressResponse): void {
  server.use(http.get(SILO_PROGRESS_URL, () => HttpResponse.json(progress)));
}
