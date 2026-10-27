import { time } from '$lib/utils/timing/time.ts';
import { describe, expect, it } from 'vitest';
import { toRelativeHumanTime } from './toRelativeHumanTime.ts';

const NOW = new Date('2026-07-07T06:00:00Z');

function ago(ms: number): string {
  return toRelativeHumanTime({
    date: new Date(NOW.getTime() - ms),
    now: NOW,
  });
}

function fromNow(ms: number): string {
  return toRelativeHumanTime({
    date: new Date(NOW.getTime() + ms),
    now: NOW,
  });
}

describe('util: toRelativeHumanTime', () => {
  describe('for past dates', () => {
    it('should say a few seconds ago for the same instant', () => {
      expect(ago(0)).toBe('a few seconds ago');
    });

    it('should say a few seconds ago until 44 seconds round up to 45', () => {
      expect(ago(time.seconds(44.4))).toBe('a few seconds ago');
      expect(ago(time.seconds(44.5))).toBe('a minute ago');
    });

    it('should say a minute ago until 90 seconds', () => {
      expect(ago(time.seconds(89))).toBe('a minute ago');
      expect(ago(time.seconds(90))).toBe('2 minutes ago');
    });

    it('should round the minutes until 44 minutes round up to 45', () => {
      expect(ago(time.minutes(44) + time.seconds(29))).toBe('44 minutes ago');
      expect(ago(time.minutes(44) + time.seconds(30))).toBe('an hour ago');
    });

    it('should say an hour ago until 90 minutes', () => {
      expect(ago(time.minutes(89) + time.seconds(30))).toBe('an hour ago');
      expect(ago(time.minutes(90))).toBe('2 hours ago');
    });

    it('should say 10 hours ago for 10 hours', () => {
      expect(ago(time.hours(10))).toBe('10 hours ago');
    });

    it('should round the hours until 21 hours round up to 22', () => {
      expect(ago(time.hours(21) + time.minutes(29))).toBe('21 hours ago');
      expect(ago(time.hours(21) + time.minutes(30))).toBe('a day ago');
    });

    it('should say a day ago until 36 hours', () => {
      expect(ago(time.hours(35) + time.minutes(59))).toBe('a day ago');
      expect(ago(time.hours(36))).toBe('2 days ago');
    });

    it('should say 21 days ago for 21 days', () => {
      expect(ago(time.days(21))).toBe('21 days ago');
    });

    it('should round the days until 25 days round up to 26', () => {
      expect(ago(time.days(25) + time.hours(11))).toBe('25 days ago');
      expect(ago(time.days(25) + time.hours(12))).toBe('a month ago');
      expect(ago(time.days(26))).toBe('a month ago');
    });

    it('should say a month ago until the months round up to 2', () => {
      expect(ago(time.days(45) + time.hours(15))).toBe('a month ago');
      expect(ago(time.days(45) + time.hours(16))).toBe('2 months ago');
    });

    it('should round the months until they round up to 11', () => {
      expect(ago(time.days(319) + time.hours(14))).toBe('10 months ago');
      expect(ago(time.days(319) + time.hours(15))).toBe('a year ago');
    });

    it('should say a year ago until the years round up to 2', () => {
      expect(ago(time.days(547))).toBe('a year ago');
      expect(ago(time.days(547) + time.hours(21))).toBe('2 years ago');
    });

    it('should round the years beyond that', () => {
      expect(ago(time.days(1000))).toBe('3 years ago');
    });
  });

  describe('for future dates', () => {
    it('should mirror each past form with in', () => {
      expect(fromNow(time.seconds(10))).toBe('in a few seconds');
      expect(fromNow(time.seconds(60))).toBe('in a minute');
      expect(fromNow(time.minutes(10))).toBe('in 10 minutes');
      expect(fromNow(time.minutes(60))).toBe('in an hour');
      expect(fromNow(time.hours(10))).toBe('in 10 hours');
      expect(fromNow(time.hours(24))).toBe('in a day');
      expect(fromNow(time.days(21))).toBe('in 21 days');
      expect(fromNow(time.days(30))).toBe('in a month');
      expect(fromNow(time.days(100))).toBe('in 3 months');
      expect(fromNow(time.days(365))).toBe('in a year');
      expect(fromNow(time.days(800))).toBe('in 2 years');
    });

    it('should use the same boundaries as past dates', () => {
      expect(fromNow(time.days(45) + time.hours(15))).toBe('in a month');
      expect(fromNow(time.days(45) + time.hours(16))).toBe('in 2 months');
      expect(fromNow(time.days(547) + time.hours(21))).toBe('in 2 years');
    });
  });

  describe('for an invalid date', () => {
    it('should return an empty string', () => {
      expect(toRelativeHumanTime({ date: new Date(NaN), now: NOW })).toBe('');
      expect(toRelativeHumanTime({ date: NOW, now: new Date(NaN) })).toBe('');
    });
  });

  describe('for a given locale', () => {
    it('should format in that locale', () => {
      expect(
        toRelativeHumanTime(
          { date: new Date(NOW.getTime() - time.hours(10)), now: NOW },
          'en',
        ),
      ).toBe('10 hours ago');
    });
  });
});
