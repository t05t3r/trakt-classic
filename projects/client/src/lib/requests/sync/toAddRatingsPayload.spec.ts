import { describe, expect, it } from 'vitest';
import { toAddRatingsPayload } from './toAddRatingsPayload.ts';

describe('toAddRatingsPayload', () => {
  it('should create a top-level season payload with its rating', () => {
    const result = toAddRatingsPayload('season', [{ id: 7, rating: 8 }]);

    expect(result).toEqual({
      seasons: [{ ids: { trakt: 7 }, rating: 8 }],
    });
  });
});
