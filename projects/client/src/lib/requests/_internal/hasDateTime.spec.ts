import { describe, expect, it } from 'vitest';
import { hasDateTime } from './hasDateTime.ts';

describe('util: hasDateTime', () => {
  const hasWatchedAt = hasDateTime('watched_at');

  it('should keep a row whose field is a valid date-time', () => {
    expect(hasWatchedAt({ watched_at: '2025-01-31T23:12:41.000Z' })).toBe(true);
  });

  it.each(['soon', null, undefined])(
    'should drop a row whose field is %j',
    (value) => {
      expect(hasWatchedAt({ watched_at: value })).toBe(false);
    },
  );

  it('should read the field it is given', () => {
    const row = {
      rated_at: '2025-01-31T23:12:41.000Z',
      watched_at: 'soon',
    };

    expect(hasDateTime('rated_at')(row)).toBe(true);
    expect(hasDateTime('watched_at')(row)).toBe(false);
  });
});
