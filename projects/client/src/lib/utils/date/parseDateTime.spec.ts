import { describe, expect, it } from 'vitest';
import { parseDateTime } from './parseDateTime.ts';

describe('util: parseDateTime', () => {
  it('should read a valid date-time as that instant', () => {
    expect(parseDateTime('2025-01-31T23:12:41.000Z')).toEqual(
      new Date('2025-01-31T23:12:41.000Z'),
    );
  });

  it('should read a value that is no date as undefined', () => {
    expect(parseDateTime('soon')).toBeUndefined();
  });

  it.each([null, undefined, ''])(
    'should read a missing value, %j, as undefined, never the epoch',
    (value) => {
      expect(parseDateTime(value)).toBeUndefined();
    },
  );
});
