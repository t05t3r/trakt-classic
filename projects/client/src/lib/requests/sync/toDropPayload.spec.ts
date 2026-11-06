import { describe, expect, it } from 'vitest';
import { toDropPayload } from './toDropPayload.ts';

describe('toDropPayload', () => {
  it('should carry the show and the time as an ISO instant', () => {
    expect(toDropPayload(4, new Date('2026-01-15T12:00:00.000Z'))).toEqual({
      shows: [{
        ids: { trakt: 4 },
        hidden_at: '2026-01-15T12:00:00.000Z',
      }],
    });
  });
});
