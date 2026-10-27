import { addDays } from '$lib/utils/date/addDays.ts';
import { getStartOfDay } from '$lib/utils/date/getStartOfDay.ts';
import { describe, expect, it } from 'vitest';
import { toRelativeHumanDay } from './toRelativeHumanDay.ts';

describe('toRelativeHumanDay', () => {
  it('should display today as Today', () => {
    const today = getStartOfDay(new Date());
    expect(toRelativeHumanDay(today, today, 'en')).toBe('today');
  });

  it('should display earlier in the day as Today', () => {
    const today = new Date();
    today.setHours(21, 49, 0, 0);

    const earlierToday = new Date();
    earlierToday.setHours(7, 39, 0, 0);
    expect(toRelativeHumanDay(today, earlierToday, 'en')).toBe('today');
  });

  it('should display tomorrow as Tomorrow', () => {
    const today = getStartOfDay(new Date());
    const tomorrow = addDays(today, 1);
    expect(toRelativeHumanDay(today, tomorrow, 'en')).toBe('tomorrow');
  });

  it('should display yesterday as Yesterday', () => {
    const today = getStartOfDay(new Date());
    const yesterday = addDays(today, -1);
    expect(toRelativeHumanDay(today, yesterday, 'en')).toBe('yesterday');
  });

  it('should display last weekday for past days in range', () => {
    const wednesday = getStartOfDay(new Date('2023-12-20'));

    const previousWeek = addDays(wednesday, -6);
    expect(toRelativeHumanDay(wednesday, previousWeek, 'en')).toBe(
      'last Thursday',
    );
  });

  it('should display formatted date for dates more than a week ago', () => {
    const today = getStartOfDay(new Date('2023-12-20'));
    const previousWeek = addDays(today, -7);
    expect(toRelativeHumanDay(today, previousWeek, 'en')).toBe(
      'December 13th, 2023',
    );
  });

  it('should display formatted date for dates more than a week in the future', () => {
    const today = getStartOfDay(new Date('2023-12-20'));
    const nextWeek = addDays(today, 7);
    expect(toRelativeHumanDay(today, nextWeek, 'en')).toBe(
      'December 27th, 2023',
    );
  });

  it('should display formatted date for dates more than 2 months ago', () => {
    const today = getStartOfDay(new Date('2023-12-20'));
    const twoMonthAgo = addDays(today, -60);
    expect(toRelativeHumanDay(today, twoMonthAgo, 'en')).toBe(
      'October 21st, 2023',
    );
  });
});
