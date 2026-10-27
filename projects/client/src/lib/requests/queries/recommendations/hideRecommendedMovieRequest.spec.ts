import { describe, expect, it, vi } from 'vitest';
import { hideRecommendedMovieRequest } from './hideRecommendedMovieRequest.ts';

describe('hideRecommendedMovieRequest', () => {
  it('should resolve void once the hide lands', async () => {
    await expect(hideRecommendedMovieRequest({ slug: 'heretic-2024' })).resolves
      .toBeUndefined();
  });

  it('should hand onResponse the final response', async () => {
    const onResponse = vi.fn<(response: Response) => void>();

    await hideRecommendedMovieRequest({ slug: 'heretic-2024', onResponse });

    expect(onResponse.mock.calls.map(([response]) => response.status))
      .toEqual([204]);
  });

  it('should abort the request on its signal', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      hideRecommendedMovieRequest({
        slug: 'heretic-2024',
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });
});
