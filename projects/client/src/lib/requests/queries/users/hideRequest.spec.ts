import { SHOW_IDS_BODY } from '$mocks/data/sync/SHOW_IDS_BODY.ts';
import { DROP_URL } from '$mocks/data/users/DROP_URL.ts';
import { HIDE_PROGRESS_URL } from '$mocks/data/users/HIDE_PROGRESS_URL.ts';
import { RESTORE_URL } from '$mocks/data/users/RESTORE_URL.ts';
import { UNHIDE_PROGRESS_URL } from '$mocks/data/users/UNHIDE_PROGRESS_URL.ts';
import { recordBodies } from '$test/beds/request/recordBodies.ts';
import { describe, expect, it, vi } from 'vitest';
import { hideRequest } from './hideRequest.ts';

describe('hideRequest', () => {
  it.each(
    [
      { section: 'dropped', mode: 'add', url: DROP_URL },
      { section: 'dropped', mode: 'remove', url: RESTORE_URL },
      { section: 'progress_watched', mode: 'add', url: HIDE_PROGRESS_URL },
      {
        section: 'progress_watched',
        mode: 'remove',
        url: UNHIDE_PROGRESS_URL,
      },
    ] as const,
  )('should $mode the items in the $section section', async ({
    section,
    mode,
    url,
  }) => {
    const bodies = recordBodies(url);

    await hideRequest({ section, mode, body: SHOW_IDS_BODY });

    expect(bodies).toEqual([SHOW_IDS_BODY]);
  });

  it('should hand onResponse the final response', async () => {
    recordBodies(DROP_URL, { status: 201 });
    const onResponse = vi.fn<(response: Response) => void>();

    await hideRequest({
      section: 'dropped',
      mode: 'add',
      body: SHOW_IDS_BODY,
      onResponse,
    });

    expect(onResponse.mock.calls.map(([response]) => response.status))
      .toEqual([201]);
  });

  it('should abort the request on its signal', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(hideRequest({
      section: 'progress_watched',
      mode: 'remove',
      body: SHOW_IDS_BODY,
      signal: controller.signal,
    })).rejects.toMatchObject({ name: 'AbortError' });
  });
});
