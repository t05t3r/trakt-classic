import { setTimeZone } from '$test/beds/date/setTimeZone.ts';
import { describe, expect, it } from 'vitest';
import { parseDateOnly } from './parseDateOnly.ts';

describe('util: parseDateOnly', () => {
  it('should read a date-only string as that local day', () => {
    setTimeZone('America/New_York');

    const date = parseDateOnly('2022-05-27');

    expect(
      [
        date?.getFullYear(),
        date?.getMonth(),
        date?.getDate(),
        date?.getHours(),
      ],
    ).toEqual([2022, 4, 27, 0]);
  });

  it('should reject an ISO datetime', () => {
    expect(parseDateOnly('2022-05-27T00:00:00.000Z')).toBeUndefined();
  });

  it('should reject a day the calendar does not have', () => {
    expect(parseDateOnly('2022-02-30')).toBeUndefined();
  });

  it('should reject garbage', () => {
    expect(parseDateOnly('soon')).toBeUndefined();
  });

  it('should read null and undefined as unknown', () => {
    expect(parseDateOnly(null)).toBeUndefined();
    expect(parseDateOnly(undefined)).toBeUndefined();
  });
});
