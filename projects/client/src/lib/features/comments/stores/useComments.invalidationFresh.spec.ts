import { HERETIC_COMMENTS_TARGET } from '$mocks/data/comments/HERETIC_COMMENTS_TARGET.ts';
import { HERETIC_COMMENTS_URL } from '$mocks/data/movies/HERETIC_COMMENTS_URL.ts';
import { ageLoadedData } from '$test/beds/query/ageLoadedData.ts';
import { nextOf } from '$test/beds/query/nextOf.ts';
import { useWaitForLateRequests } from '$test/beds/query/useWaitForLateRequests.ts';
import { commentPage } from '$test/beds/request/commentPage.ts';
import { recordSearches } from '$test/beds/request/recordSearches.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { openAt } from '$test/beds/url/openAt.ts';
import { describe, expect, it } from 'vitest';
import { useComments } from './useComments.ts';

// The invalidation hook fires once per query id per module, so this probe needs a module where it has seen none.
describe('store: useComments, invalidation hook on a fresh module', () => {
  it('should not refetch page one for a second pane on data loaded 31 s ago', async () => {
    openAt('/movies/heretic-2024');
    const searches = recordSearches(
      `${HERETIC_COMMENTS_URL}/likes`,
      commentPage({ page: 1 }),
    );
    const { first, second, waitForLateRequests } = await renderStore(() => ({
      first: useComments(HERETIC_COMMENTS_TARGET),
      second: useComments(HERETIC_COMMENTS_TARGET),
      waitForLateRequests: useWaitForLateRequests(),
    }));
    await nextOf(first.status, 'ready');
    ageLoadedData();

    await nextOf(second.status, 'ready');
    await waitForLateRequests();

    expect(searches.map((search) => search.get('page'))).toEqual(['1']);
  });
});
