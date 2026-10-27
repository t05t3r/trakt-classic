import { setTimeZone } from '$test/beds/date/setTimeZone.ts';
import { describe, expect, it } from 'vitest';
import { toHumanDayTime } from './toHumanDayTime.ts';

describe('toHumanDayTime', () => {
  // Fixed date in January (standard time) for deterministic tests.
  const now = new Date('2025-01-06T00:00:00Z');

  it('should keep the same day and time when source and user timezones match', () => {
    const result = toHumanDayTime(
      { day: 'Monday', time: '10:00', timezone: 'UTC', locale: 'en', now },
    );

    expect(result).toEqual({ day: 'Monday', time: '10:00' });
  });

  it('should convert across timezones within the same day', () => {
    const result = toHumanDayTime(
      {
        day: 'Monday',
        time: '10:00',
        timezone: 'America/New_York',
        locale: 'en',
        now,
      },
    );

    expect(result).toEqual({ day: 'Monday', time: '15:00' });
  });

  it('should wrap the day when the source time crosses midnight UTC', () => {
    const result = toHumanDayTime(
      {
        day: 'Monday',
        time: '22:00',
        timezone: 'America/New_York',
        locale: 'en',
        now,
      },
    );

    expect(result).toEqual({ day: 'Tuesday', time: '03:00' });
  });

  it('should use DST offset when reference date is in summer', () => {
    const summer = new Date('2025-07-07T00:00:00Z');
    const result = toHumanDayTime(
      {
        day: 'Monday',
        time: '10:00',
        timezone: 'America/New_York',
        locale: 'en',
        now: summer,
      },
    );

    expect(result).toEqual({ day: 'Monday', time: '14:00' });
  });

  it('should read midnight as 00:00', () => {
    const result = toHumanDayTime(
      { day: 'Monday', time: '00:00', timezone: 'UTC', locale: 'en', now },
    );

    expect(result).toEqual({ day: 'Monday', time: '00:00' });
  });

  it('should return undefined for an invalid day', () => {
    const result = toHumanDayTime(
      { day: 'Funday', time: '10:00', timezone: 'UTC', locale: 'en', now },
    );

    expect(result).toBeUndefined();
  });

  it('should return undefined for an invalid time', () => {
    const result = toHumanDayTime(
      { day: 'Monday', time: 'not-a-time', timezone: 'UTC', locale: 'en', now },
    );

    expect(result).toBeUndefined();
  });

  it('should return undefined for an unknown time zone', () => {
    const result = toHumanDayTime(
      {
        day: 'Monday',
        time: '10:00',
        timezone: 'Mars/Olympus_Mons',
        locale: 'en',
        now,
      },
    );

    expect(result).toBeUndefined();
  });

  it.each([
    {
      edge: 'the last day of a month, east of UTC',
      day: 'Saturday',
      time: '21:20',
      timezone: 'Asia/Seoul',
      week: '2026-10-28T12:00:00Z',
      expected: { day: 'Saturday', time: '12:20' },
    },
    {
      edge: 'the last day of a year, east of UTC',
      day: 'Thursday',
      time: '21:20',
      timezone: 'Asia/Seoul',
      week: '2026-12-30T12:00:00Z',
      expected: { day: 'Thursday', time: '12:20' },
    },
    {
      edge: 'the first day of a month, west of UTC',
      day: 'Sunday',
      time: '02:00',
      timezone: 'America/New_York',
      week: '2026-02-04T12:00:00Z',
      expected: { day: 'Sunday', time: '07:00' },
    },
    {
      edge: 'the first day of a year, west of UTC',
      day: 'Friday',
      time: '02:00',
      timezone: 'America/New_York',
      week: '2026-12-30T12:00:00Z',
      expected: { day: 'Friday', time: '07:00' },
    },
  ])(
    'should keep the day of a slot on $edge',
    ({ day, time, timezone, week, expected }) => {
      const result = toHumanDayTime(
        { day, time, timezone, locale: 'en', now: new Date(week) },
      );

      expect(result).toEqual(expected);
    },
  );

  it.each([
    {
      timezone: 'America/New_York',
      shift: 'spring forward',
      day: 'Sunday',
      time: '03:30',
      week: '2026-03-10T12:00:00Z',
    },
    {
      timezone: 'America/New_York',
      shift: 'fall back',
      day: 'Sunday',
      time: '02:30',
      week: '2026-11-03T12:00:00Z',
    },
    {
      timezone: 'Europe/Berlin',
      shift: 'spring forward',
      day: 'Sunday',
      time: '01:30',
      week: '2026-03-31T12:00:00Z',
    },
  ])(
    'should keep the slot for a viewer in $timezone the week its clocks $shift',
    ({ timezone, day, time, week }) => {
      setTimeZone(timezone);

      const result = toHumanDayTime(
        { day, time, timezone, locale: 'en', now: new Date(week) },
      );

      expect(result).toEqual({ day, time });
    },
  );
});
