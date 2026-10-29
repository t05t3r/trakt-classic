import { REPLIED_COMMENT_ID } from '$mocks/data/comments/REPLIED_COMMENT_ID.ts';
import { REPLIED_COMMENT_REPLIES_URL } from '$mocks/data/comments/REPLIED_COMMENT_REPLIES_URL.ts';
import { commentResponse } from '$test/beds/request/commentResponse.ts';
import { nextOf } from '$test/beds/query/nextOf.ts';
import { useWaitForLateRequests } from '$test/beds/query/useWaitForLateRequests.ts';
import { pagedResponse } from '$test/beds/request/pagedResponse.ts';
import { recordSearches } from '$test/beds/request/recordSearches.ts';
import { serveTwoPages } from '$test/beds/request/serveTwoPages.ts';
import { idsOf } from '$test/beds/store/idsOf.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { describe, expect, it, vi } from 'vitest';
import { REPLIES_LIMIT } from './REPLIES_LIMIT.ts';
import { useCommentReplies } from './useCommentReplies.ts';

const REPLIES = [commentResponse({ id: 2 }), commentResponse({ id: 3 })];

function readReplies() {
  return renderStore(() => ({
    status: useCommentReplies(REPLIED_COMMENT_ID),
    waitForLateRequests: useWaitForLateRequests(),
  }));
}

describe('store: useCommentReplies', () => {
  it("should read the comment's replies as ready", async () => {
    recordSearches(REPLIED_COMMENT_REPLIES_URL, REPLIES);
    const { status } = await readReplies();

    const ready = await nextOf(status, 'ready');

    expect(idsOf(ready.data)).toEqual([2, 3]);
  });

  it('should ask for the first page at the replies limit', async () => {
    const searches = recordSearches(REPLIED_COMMENT_REPLIES_URL, REPLIES);
    const { status } = await readReplies();

    await nextOf(status, 'ready');

    expect(searches.map((search) => Object.fromEntries(search))).toEqual([
      expect.objectContaining({ page: '1', limit: String(REPLIES_LIMIT) }),
    ]);
  });

  it('should read no replies as empty', async () => {
    recordSearches(REPLIED_COMMENT_REPLIES_URL, []);
    const { status } = await readReplies();

    expect(await nextOf(status, 'empty')).toEqual({ kind: 'empty' });
  });

  it('should never ask for a next page', async () => {
    const second = vi.fn(() => pagedResponse({ body: [], page: 2 }));
    serveTwoPages({ url: REPLIED_COMMENT_REPLIES_URL, first: REPLIES, second });
    const { status, waitForLateRequests } = await readReplies();

    await nextOf(status, 'ready');
    await waitForLateRequests();

    expect(second).not.toHaveBeenCalled();
  });
});
