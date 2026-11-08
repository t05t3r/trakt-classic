import { recordBodies } from '$test/beds/request/recordBodies.ts';
import { describe, expect, it } from 'vitest';
import { reorderListRequest } from './reorderListRequest.ts';

describe('reorderListRequest', () => {
  it('should post item ids in rank order to the list', async () => {
    const bodies = recordBodies(
      'http://localhost/users/me/lists/7/items/reorder',
    );

    const result = await reorderListRequest({
      userId: 'me',
      listId: 7,
      rank: [2, 1],
    });

    expect(result).to.equal(true);
    expect(bodies).to.deep.equal([{ rank: [2, 1] }]);
  });
});
