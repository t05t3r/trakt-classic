import { setTimeZone } from '$test/beds/date/setTimeZone.ts';
import { describe, expect, it } from 'vitest';
import { toDateRangeDays } from './toDateRangeDays.ts';

describe('util: toDateRangeDays', () => {
  it('should read no bounds as two open ends', () => {
    expect(toDateRangeDays({})).toEqual({ start: '', end: '' });
  });

  it('should read an end at the last instant of a day as that day', () => {
    expect(toDateRangeDays({
      startDate: new Date(2026, 5, 7),
      endDate: new Date(2026, 5, 30, 23, 59, 59, 999),
    })).toEqual({ start: '2026-06-07', end: '2026-06-30' });
  });

  it("should read an end at a day's start as the day before", () => {
    expect(toDateRangeDays({
      startDate: new Date(2026, 5, 7),
      endDate: new Date(2026, 5, 8),
    })).toEqual({ start: '2026-06-07', end: '2026-06-07' });
  });

  it('should leave the end open with a start alone', () => {
    expect(toDateRangeDays({ startDate: new Date(2026, 5, 7) }))
      .toEqual({ start: '2026-06-07', end: '' });
  });

  it('should leave the start open with an end alone', () => {
    expect(toDateRangeDays({ endDate: new Date(2026, 5, 30, 23, 59, 59, 999) }))
      .toEqual({ start: '', end: '2026-06-30' });
  });

  describe('on a day with no midnight', () => {
    it('should read an end at its first instant as the day before', () => {
      setTimeZone('America/Havana');
      // 8 March 2026 opens at 01:00 there.
      const endDate = new Date(2026, 2, 8);

      expect(endDate.getHours()).toBe(1);
      expect(toDateRangeDays({ startDate: new Date(2026, 2, 7), endDate }))
        .toEqual({ start: '2026-03-07', end: '2026-03-07' });
    });

    it('should read a start at its first instant as that day', () => {
      setTimeZone('America/Havana');

      expect(toDateRangeDays({ startDate: new Date(2026, 2, 8) }))
        .toEqual({ start: '2026-03-08', end: '' });
    });

    it('should read an end at its last instant as that day', () => {
      setTimeZone('America/Havana');

      expect(toDateRangeDays({
        endDate: new Date(2026, 2, 8, 23, 59, 59, 999),
      })).toEqual({ start: '', end: '2026-03-08' });
    });
  });
});
