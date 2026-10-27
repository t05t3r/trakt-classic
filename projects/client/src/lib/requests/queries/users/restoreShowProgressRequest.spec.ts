import { SHOW_IDS_BODY } from '$mocks/data/sync/SHOW_IDS_BODY.ts';
import { server } from '$mocks/server.ts';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { restoreShowProgressRequest } from './restoreShowProgressRequest.ts';

describe('restoreShowProgressRequest', () => {
  it('should hand onResponse the final response', async () => {
    server.use(
      http.post(
        'http://localhost/users/hidden/progress_watched/remove',
        () => HttpResponse.json({}, { status: 200 }),
      ),
    );
    const onResponse = vi.fn<(response: Response) => void>();

    await restoreShowProgressRequest({
      body: SHOW_IDS_BODY,
      onResponse,
    });

    expect(onResponse.mock.calls.map(([response]) => response.status))
      .toEqual([200]);
  });

  it('should abort the request on its signal', async () => {
    server.use(
      http.post(
        'http://localhost/users/hidden/progress_watched/remove',
        () => HttpResponse.json({}, { status: 200 }),
      ),
    );
    const controller = new AbortController();
    controller.abort();

    await expect(restoreShowProgressRequest({
      body: SHOW_IDS_BODY,
      signal: controller.signal,
    })).rejects.toMatchObject({ name: 'AbortError' });
  });
});
