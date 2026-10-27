import { SHOW_IDS_BODY } from '$mocks/data/sync/SHOW_IDS_BODY.ts';
import { DROP_URL } from '$mocks/data/users/DROP_URL.ts';
import { server } from '$mocks/server.ts';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { dropShowRequest } from './dropShowRequest.ts';

describe('dropShowRequest', () => {
  it('should hand onResponse the final response', async () => {
    server.use(
      http.post(
        DROP_URL,
        () => HttpResponse.json({}, { status: 201 }),
      ),
    );
    const onResponse = vi.fn<(response: Response) => void>();

    await dropShowRequest({
      body: SHOW_IDS_BODY,
      onResponse,
    });

    expect(onResponse.mock.calls.map(([response]) => response.status))
      .toEqual([201]);
  });

  it('should abort the request on its signal', async () => {
    server.use(
      http.post(
        DROP_URL,
        () => HttpResponse.json({}, { status: 201 }),
      ),
    );
    const controller = new AbortController();
    controller.abort();

    await expect(dropShowRequest({
      body: SHOW_IDS_BODY,
      signal: controller.signal,
    })).rejects.toMatchObject({ name: 'AbortError' });
  });
});
