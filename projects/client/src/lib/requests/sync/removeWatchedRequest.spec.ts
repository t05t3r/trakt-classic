import { MOVIE_IDS_BODY } from '$mocks/data/sync/MOVIE_IDS_BODY.ts';
import { SYNC_HISTORY_REMOVE_URL } from '$mocks/data/sync/SYNC_HISTORY_REMOVE_URL.ts';
import { server } from '$mocks/server.ts';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { removeWatchedRequest } from './removeWatchedRequest.ts';

describe('removeWatchedRequest', () => {
  it('should hand onResponse the final response', async () => {
    server.use(
      http.post(
        SYNC_HISTORY_REMOVE_URL,
        () => HttpResponse.json({}, { status: 200 }),
      ),
    );
    const onResponse = vi.fn<(response: Response) => void>();

    await removeWatchedRequest({
      body: MOVIE_IDS_BODY,
      onResponse,
    });

    expect(onResponse.mock.calls.map(([response]) => response.status))
      .toEqual([200]);
  });

  it('should abort the request on its signal', async () => {
    server.use(
      http.post(
        SYNC_HISTORY_REMOVE_URL,
        () => HttpResponse.json({}, { status: 200 }),
      ),
    );
    const controller = new AbortController();
    controller.abort();

    await expect(removeWatchedRequest({
      body: MOVIE_IDS_BODY,
      signal: controller.signal,
    })).rejects.toMatchObject({ name: 'AbortError' });
  });
});
