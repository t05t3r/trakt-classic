import { recordBodies } from '$test/beds/request/recordBodies.ts';
import { describe, expect, it } from 'vitest';
import { reorderWatchlistRequest } from './reorderWatchlistRequest.ts';

const REORDER_URL = 'http://localhost/sync/watchlist/reorder';

describe('reorderWatchlistRequest', () => {
  it('should post item ids in rank order', async () => {
    const bodies = recordBodies(REORDER_URL);

    const result = await reorderWatchlistRequest({ rank: [2, 1] });

    expect(result).to.equal(true);
    expect(bodies).to.deep.equal([{ rank: [2, 1] }]);
  });

  it('should report a refused reorder', async () => {
    recordBodies(REORDER_URL, { status: 420 });

    expect(await reorderWatchlistRequest({ rank: [2, 1] })).to.equal(false);
  });
});
