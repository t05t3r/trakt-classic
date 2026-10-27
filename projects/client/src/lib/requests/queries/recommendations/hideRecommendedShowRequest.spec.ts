import { describe, expect, it, vi } from 'vitest';
import { hideRecommendedShowRequest } from './hideRecommendedShowRequest.ts';

describe('hideRecommendedShowRequest', () => {
  it('should resolve void once the hide lands', async () => {
    await expect(hideRecommendedShowRequest({ slug: 'silo' })).resolves
      .toBeUndefined();
  });

  it('should hand onResponse the final response', async () => {
    const onResponse = vi.fn<(response: Response) => void>();

    await hideRecommendedShowRequest({ slug: 'silo', onResponse });

    expect(onResponse.mock.calls.map(([response]) => response.status))
      .toEqual([204]);
  });

  it('should abort the request on its signal', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      hideRecommendedShowRequest({ slug: 'silo', signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });
});
