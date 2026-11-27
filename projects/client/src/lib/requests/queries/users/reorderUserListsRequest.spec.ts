import { recordBodies } from '$test/beds/request/recordBodies.ts';
import { HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { reorderUserListsRequest } from './reorderUserListsRequest.ts';

describe('reorderUserListsRequest', () => {
  it('should post list ids in rank order', async () => {
    const bodies = recordBodies('http://localhost/users/me/lists/reorder', {
      answer: () => HttpResponse.json({ updated: 2, skipped_ids: [] }),
    });

    const result = await reorderUserListsRequest({
      userId: 'me',
      rank: [2, 1],
    });

    expect(result).to.equal(true);
    expect(bodies).to.deep.equal([{ rank: [2, 1] }]);
  });
});
