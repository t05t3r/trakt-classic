import { SYNC_RATINGS_URL } from '$mocks/data/sync/SYNC_RATINGS_URL.ts';
import { server } from '$mocks/server.ts';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { addRatingRequest } from './addRatingRequest.ts';

describe('addRatingRequest', () => {
  it('should hand onResponse the final response', async () => {
    server.use(
      http.post(
        SYNC_RATINGS_URL,
        () => HttpResponse.json({}, { status: 201 }),
      ),
    );
    const onResponse = vi.fn<(response: Response) => void>();

    await addRatingRequest({
      body: { movies: [{ ids: { trakt: 1 }, rating: 8 }] },
      onResponse,
    });

    expect(onResponse.mock.calls.map(([response]) => response.status))
      .toEqual([201]);
  });

  it('should abort the request on its signal', async () => {
    server.use(
      http.post(
        SYNC_RATINGS_URL,
        () => HttpResponse.json({}, { status: 201 }),
      ),
    );
    const controller = new AbortController();
    controller.abort();

    await expect(addRatingRequest({
      body: { movies: [{ ids: { trakt: 1 }, rating: 8 }] },
      signal: controller.signal,
    })).rejects.toMatchObject({ name: 'AbortError' });
  });
});
