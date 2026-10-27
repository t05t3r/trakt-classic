import { addDays } from '$lib/utils/date/addDays.ts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isCurrentWeek } from './isCurrentWeek.ts';

function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

describe('isCurrentWeek', () => {
  it('should return true for today', () => {
    const today = new Date();

    expect(isCurrentWeek(today, 'en')).toBe(true);
  });

  it('should return true for the start of current week (Sunday)', () => {
    const today = new Date();
    const sunday = addDays(today, -today.getDay());

    expect(isCurrentWeek(sunday, 'en')).toBe(true);
  });

  it('should return true for the end of current week (Saturday)', () => {
    const today = new Date();
    const saturday = addDays(today, 6 - today.getDay());

    expect(isCurrentWeek(saturday, 'en')).toBe(true);
  });

  it('should return false for last week', () => {
    const today = new Date();
    const lastWeek = addWeeks(today, -1);

    expect(isCurrentWeek(lastWeek, 'en')).toBe(false);
  });

  it('should return false for next week', () => {
    const today = new Date();
    const nextWeek = addWeeks(today, 1);

    expect(isCurrentWeek(nextWeek, 'en')).toBe(false);
  });

  it('should return false for a date 2 weeks ago', () => {
    const today = new Date();
    const twoWeeksAgo = addWeeks(today, -2);

    expect(isCurrentWeek(twoWeeksAgo, 'en')).toBe(false);
  });

  it('should return false for a date 2 weeks in the future', () => {
    const today = new Date();
    const twoWeeksFromNow = addWeeks(today, 2);

    expect(isCurrentWeek(twoWeeksFromNow, 'en')).toBe(false);
  });

  describe('for locales the app does not ship', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 0, 8, 12));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should fall back to en and start the week on Sunday', () => {
      const sunday = new Date(2025, 0, 5, 12);

      expect(isCurrentWeek(sunday, 'de-DE')).toBe(true);
      expect(isCurrentWeek(sunday, 'fr-FR')).toBe(true);
    });
  });
});
