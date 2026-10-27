import { MOVIE_IDS_BODY } from '$mocks/data/sync/MOVIE_IDS_BODY.ts';
import { server } from '$mocks/server.ts';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { removeFromListRequest } from './removeFromListRequest.ts';

describe('removeFromListRequest', () => {
  it('should hand onResponse the final response', async () => {
    server.use(
      http.post(
        'http://localhost/users/me/lists/7/items/remove',
        () => HttpResponse.json({}, { status: 200 }),
      ),
    );
    const onResponse = vi.fn<(response: Response) => void>();

    await removeFromListRequest({
      body: MOVIE_IDS_BODY,
      listId: 7,
      onResponse,
    });

    expect(onResponse.mock.calls.map(([response]) => response.status))
      .toEqual([200]);
  });

  it('should abort the request on its signal', async () => {
    server.use(
      http.post(
        'http://localhost/users/me/lists/7/items/remove',
        () => HttpResponse.json({}, { status: 200 }),
      ),
    );
    const controller = new AbortController();
    controller.abort();

    await expect(removeFromListRequest({
      body: MOVIE_IDS_BODY,
      listId: 7,
      signal: controller.signal,
    })).rejects.toMatchObject({ name: 'AbortError' });
  });
});
