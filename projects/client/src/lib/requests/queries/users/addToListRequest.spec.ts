import { MOVIE_IDS_BODY } from '$mocks/data/sync/MOVIE_IDS_BODY.ts';
import { server } from '$mocks/server.ts';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { addToListRequest } from './addToListRequest.ts';

describe('addToListRequest', () => {
  it('should hand onResponse the final response', async () => {
    server.use(
      http.post(
        'http://localhost/users/me/lists/7/items',
        () => HttpResponse.json({}, { status: 201 }),
      ),
    );
    const onResponse = vi.fn<(response: Response) => void>();

    await addToListRequest({
      body: MOVIE_IDS_BODY,
      listId: 7,
      onResponse,
    });

    expect(onResponse.mock.calls.map(([response]) => response.status))
      .toEqual([201]);
  });

  it('should abort the request on its signal', async () => {
    server.use(
      http.post(
        'http://localhost/users/me/lists/7/items',
        () => HttpResponse.json({}, { status: 201 }),
      ),
    );
    const controller = new AbortController();
    controller.abort();

    await expect(addToListRequest({
      body: MOVIE_IDS_BODY,
      listId: 7,
      signal: controller.signal,
    })).rejects.toMatchObject({ name: 'AbortError' });
  });
});
