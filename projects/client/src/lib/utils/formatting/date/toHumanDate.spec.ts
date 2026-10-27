import { addDays } from '$lib/utils/date/addDays.ts';
import { getStartOfDay } from '$lib/utils/date/getStartOfDay.ts';
import { describe, expect, it } from 'vitest';
import { toHumanDate } from './toHumanDate.ts';

function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

describe('toHumanDate', () => {
  it('should display Sunday at 12:00 AM', () => {
    const today = getStartOfDay(new Date('2023-12-20'));
    const nextSunday = addDays(today, 7 - today.getDay());

    expect(toHumanDate(today, nextSunday, 'en')).toBe('Sunday at 12:00 AM');
  });

  it('should display tomorrow at 12:00 AM', () => {
    const today = getStartOfDay(new Date());
    const nextMonday = addDays(today, 1);

    expect(toHumanDate(today, nextMonday, 'en')).toBe('tomorrow at 12:00 AM');
  });

  it('should display yesterday at 12:00 AM', () => {
    const today = getStartOfDay(new Date());
    const yesterday = addDays(today, -1);

    expect(toHumanDate(today, yesterday, 'en')).toBe('yesterday at 12:00 AM');
  });

  it('should display the relative date if it is 6 days in the future', () => {
    const wednesday = getStartOfDay(new Date('2023-12-20'));

    const nextWeek = addDays(wednesday, 6);

    expect(toHumanDate(wednesday, nextWeek, 'en')).toBe(
      'Tuesday at 12:00 AM',
    );
  });

  it('should display the relative date if it is 6 days in the past', () => {
    const wednesday = getStartOfDay(new Date('2023-12-20'));

    const previousWeek = addDays(wednesday, -6);

    expect(toHumanDate(wednesday, previousWeek, 'en')).toBe(
      'last Thursday at 12:00 AM',
    );
  });

  it('should display the date in the past if is more than 1 week ago', () => {
    const wednesday = getStartOfDay(new Date('2023-12-20'));

    const previousWeek = addDays(wednesday, -7);

    expect(toHumanDate(wednesday, previousWeek, 'en')).toBe(
      'December 13th, 2023 at 12:00 AM',
    );
  });

  it('should display the date in the future if is more than 1 week in the future', () => {
    const wednesday = getStartOfDay(new Date('2023-12-20'));

    const nextWeek = addDays(wednesday, 7);

    expect(toHumanDate(wednesday, nextWeek, 'en')).toBe(
      'December 27th, 2023 at 12:00 AM',
    );
  });

  it('should display the date in the past if is more than strictly more 6 days ', () => {
    const wednesday = getStartOfDay(new Date('2023-12-20'));

    const previousWeek = addHours(addDays(wednesday, -6), -4);

    expect(toHumanDate(wednesday, previousWeek, 'en')).toBe(
      'December 13th, 2023 at 8:00 PM',
    );
  });

  it('should display the date in the past if is more than 2 months ago', () => {
    const wednesday = getStartOfDay(new Date('2023-12-20'));

    const twoMonthAgo = addDays(wednesday, -60);

    expect(toHumanDate(wednesday, twoMonthAgo, 'en')).toBe(
      'October 21st, 2023 at 12:00 AM',
    );
  });
});
