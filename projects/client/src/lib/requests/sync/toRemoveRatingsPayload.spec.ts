import { describe, expect, it } from 'vitest';
import { toRemoveRatingsPayload } from './toRemoveRatingsPayload.ts';

describe('toRemoveRatingsPayload', () => {
  it('should create a top-level season payload', () => {
    const result = toRemoveRatingsPayload('season', [7]);

    expect(result).toEqual({
      seasons: [{ ids: { trakt: 7 } }],
    });
  });
});
