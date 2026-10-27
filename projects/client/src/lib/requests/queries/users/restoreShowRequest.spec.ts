import { SHOW_IDS_BODY } from '$mocks/data/sync/SHOW_IDS_BODY.ts';
import { RESTORE_URL } from '$mocks/data/users/RESTORE_URL.ts';
import { server } from '$mocks/server.ts';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { restoreShowRequest } from './restoreShowRequest.ts';

function recordRestoreBodies(): unknown[] {
  const bodies: unknown[] = [];
  server.use(
    http.post(
      RESTORE_URL,
      async ({ request }) => {
        bodies.push(await request.json());
        return new HttpResponse(null, { status: 200 });
      },
    ),
  );

  return bodies;
}

describe('restoreShowRequest', () => {
  it('should send the shows to the dropped section', async () => {
    const bodies = recordRestoreBodies();

    await restoreShowRequest({ body: SHOW_IDS_BODY });

    expect(bodies).toEqual([SHOW_IDS_BODY]);
  });

  it('should hand onResponse the final response', async () => {
    recordRestoreBodies();
    const onResponse = vi.fn<(response: Response) => void>();

    await restoreShowRequest({ body: SHOW_IDS_BODY, onResponse });

    expect(onResponse.mock.calls.map(([response]) => response.status))
      .toEqual([200]);
  });

  it('should abort the request on its signal', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      restoreShowRequest({ body: SHOW_IDS_BODY, signal: controller.signal }),
    )
      .rejects.toMatchObject({ name: 'AbortError' });
  });
});
