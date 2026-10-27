import { MOVIE_IDS_BODY } from '$mocks/data/sync/MOVIE_IDS_BODY.ts';
import { SYNC_RATINGS_REMOVE_URL } from '$mocks/data/sync/SYNC_RATINGS_REMOVE_URL.ts';
import { server } from '$mocks/server.ts';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { removeRatingRequest } from './removeRatingRequest.ts';

describe('removeRatingRequest', () => {
  it('should hand onResponse the final response', async () => {
    server.use(
      http.post(
        SYNC_RATINGS_REMOVE_URL,
        () => HttpResponse.json({}, { status: 200 }),
      ),
    );
    const onResponse = vi.fn<(response: Response) => void>();

    await removeRatingRequest({
      body: MOVIE_IDS_BODY,
      onResponse,
    });

    expect(onResponse.mock.calls.map(([response]) => response.status))
      .toEqual([200]);
  });

  it('should abort the request on its signal', async () => {
    server.use(
      http.post(
        SYNC_RATINGS_REMOVE_URL,
        () => HttpResponse.json({}, { status: 200 }),
      ),
    );
    const controller = new AbortController();
    controller.abort();

    await expect(removeRatingRequest({
      body: MOVIE_IDS_BODY,
      signal: controller.signal,
    })).rejects.toMatchObject({ name: 'AbortError' });
  });
});
