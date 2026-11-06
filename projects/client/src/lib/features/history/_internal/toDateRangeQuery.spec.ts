import { setTimeZone } from '$test/beds/date/setTimeZone.ts';
import { describe, expect, it } from 'vitest';
import { toDateRangeQuery } from './toDateRangeQuery.ts';

const NOTHING = { start_at: null, end_at: null, days: null };

const START_OF_JUNE_7 = new Date('2026-06-07T00:00:00.000Z');
const END_OF_JUNE_7 = new Date('2026-06-07T23:59:59.999Z');
const END_OF_JUNE_30 = new Date('2026-06-30T23:59:59.999Z');

describe('util: toDateRangeQuery', () => {
  it('should read no params as no bounds', () => {
    expect(toDateRangeQuery(NOTHING)).toStrictEqual({});
  });

  describe('dates', () => {
    it('should read start_at alone as the start only', () => {
      expect(toDateRangeQuery({ ...NOTHING, start_at: '2026-06-07' }))
        .toStrictEqual({ startDate: START_OF_JUNE_7 });
    });

    it('should read end_at alone as the end only', () => {
      expect(toDateRangeQuery({ ...NOTHING, end_at: '2026-06-30' }))
        .toStrictEqual({ endDate: END_OF_JUNE_30 });
    });

    it('should read both dates as both bounds', () => {
      expect(
        toDateRangeQuery({
          ...NOTHING,
          start_at: '2026-06-07',
          end_at: '2026-06-30',
        }),
      ).toStrictEqual({ startDate: START_OF_JUNE_7, endDate: END_OF_JUNE_30 });
    });

    it('should read start_at equal to end_at as that one day', () => {
      expect(
        toDateRangeQuery({
          ...NOTHING,
          start_at: '2026-06-07',
          end_at: '2026-06-07',
        }),
      ).toStrictEqual({ startDate: START_OF_JUNE_7, endDate: END_OF_JUNE_7 });
    });

    it('should drop both dates when the start is after the end', () => {
      expect(
        toDateRangeQuery({
          ...NOTHING,
          start_at: '2026-06-30',
          end_at: '2026-06-07',
        }),
      ).toStrictEqual({});
    });
  });

  describe('Classic forms', () => {
    it.each([
      { form: 'a negative offset', value: '2026-06-07T00:00:00-03:00' },
      { form: 'a + read as a space', value: '2026-06-07T00:00:00 03:00' },
      { form: 'a literal + offset', value: '2026-06-07T00:00:00+03:00' },
      { form: 'no offset', value: '2026-06-07T23:59:59' },
      { form: 'UTC', value: '2026-06-07T02:41:51Z' },
    ])('should land $form on its date as the start', ({ value }) => {
      expect(toDateRangeQuery({ ...NOTHING, start_at: value }))
        .toStrictEqual({ startDate: START_OF_JUNE_7 });
    });

    it.each([
      { form: 'a negative offset', value: '2026-06-07T23:45:00-03:00' },
      { form: 'a + read as a space', value: '2026-06-07T23:45:00 03:00' },
      { form: 'a literal + offset', value: '2026-06-07T23:45:00+03:00' },
      { form: 'no offset', value: '2026-06-07T23:59:59' },
      { form: 'UTC', value: '2026-06-07T02:41:51Z' },
    ])('should land $form on the end of its date as the end', ({ value }) => {
      expect(toDateRangeQuery({ ...NOTHING, end_at: value }))
        .toStrictEqual({ endDate: END_OF_JUNE_7 });
    });

    it('should land a time no clock shows on its date, since only its shape counts', () => {
      expect(toDateRangeQuery({ ...NOTHING, start_at: '2026-06-07T99:99:99' }))
        .toStrictEqual({ startDate: START_OF_JUNE_7 });
    });

    it.each([
      { reason: 'a word', value: 'yesterday' },
      { reason: 'an empty value', value: '' },
      { reason: 'a date that does not exist', value: '2026-02-30' },
      {
        reason: 'a datetime on a date that does not exist',
        value: '2026-02-30T00:00:00Z',
      },
      { reason: 'a date in the year zero', value: '0000-06-07' },
      { reason: 'a month and day out of order', value: '06-07-2026' },
      { reason: 'text after the date', value: '2026-06-07abc' },
      { reason: 'a time with no seconds', value: '2026-06-07T00:00' },
      { reason: 'a time with fractions', value: '2026-06-07T00:00:00.000Z' },
    ])('should read $reason as absent', ({ value }) => {
      expect(toDateRangeQuery({ ...NOTHING, start_at: value }))
        .toStrictEqual({});
      expect(toDateRangeQuery({ ...NOTHING, end_at: value }))
        .toStrictEqual({});
    });
  });

  describe('days', () => {
    it('should end at 00:00 on the Nth day after the start', () => {
      expect(
        toDateRangeQuery({ ...NOTHING, start_at: '2026-06-07', days: '1' }),
      ).toStrictEqual({
        startDate: START_OF_JUNE_7,
        endDate: new Date('2026-06-08T00:00:00.000Z'),
      });
      expect(
        toDateRangeQuery({ ...NOTHING, start_at: '2026-06-07', days: '30' }),
      ).toStrictEqual({
        startDate: START_OF_JUNE_7,
        endDate: new Date('2026-07-07T00:00:00.000Z'),
      });
    });

    it('should read days without start_at as no bounds', () => {
      expect(toDateRangeQuery({ ...NOTHING, days: '1' })).toStrictEqual({});
    });

    it.each([
      { reason: 'zero', days: '0' },
      { reason: 'a non-number', days: 'abc' },
      { reason: 'an empty value', days: '' },
      { reason: 'a leading zero', days: '01' },
      { reason: 'a sign', days: '-1' },
      { reason: 'a fraction', days: '1.5' },
      { reason: 'one past the pattern', days: '100000' },
    ])('should read $reason as absent', ({ days }) => {
      expect(toDateRangeQuery({ ...NOTHING, start_at: '2026-06-07', days }))
        .toStrictEqual({ startDate: START_OF_JUNE_7 });
    });

    it('should take the last value of the pattern', () => {
      expect(
        toDateRangeQuery({ ...NOTHING, start_at: '2026-06-07', days: '99999' })
          .endDate,
      ).toEqual(new Date('2300-03-22T00:00:00.000Z'));
    });

    it('should ignore days with both dates', () => {
      expect(
        toDateRangeQuery({
          start_at: '2026-06-07',
          end_at: '2026-06-30',
          days: '1',
        }),
      ).toStrictEqual({ startDate: START_OF_JUNE_7, endDate: END_OF_JUNE_30 });
    });

    it('should ignore days when a start after the end drops both', () => {
      expect(
        toDateRangeQuery({
          start_at: '2026-06-30',
          end_at: '2026-06-07',
          days: '1',
        }),
      ).toStrictEqual({});
    });
  });

  describe('each param on its own', () => {
    it('should read an invalid start with a valid end as the end alone', () => {
      expect(
        toDateRangeQuery({
          start_at: 'yesterday',
          end_at: '2026-06-30',
          days: '1',
        }),
      ).toStrictEqual({ endDate: END_OF_JUNE_30 });
    });

    it('should count days with a valid start and an invalid end', () => {
      expect(
        toDateRangeQuery({
          start_at: '2026-06-07',
          end_at: 'tomorrow',
          days: '1',
        }),
      ).toStrictEqual({
        startDate: START_OF_JUNE_7,
        endDate: new Date('2026-06-08T00:00:00.000Z'),
      });
    });

    it('should read a valid start with an invalid end as the start alone', () => {
      expect(
        toDateRangeQuery({ ...NOTHING, start_at: '2026-06-07', end_at: 'x' }),
      ).toStrictEqual({ startDate: START_OF_JUNE_7 });
    });
  });

  describe('time zones', () => {
    it.each([
      {
        zone: 'Asia/Tokyo',
        startDate: '2026-06-06T15:00:00.000Z',
        endDate: '2026-06-30T14:59:59.999Z',
      },
      {
        zone: 'America/New_York',
        startDate: '2026-06-07T04:00:00.000Z',
        endDate: '2026-07-01T03:59:59.999Z',
      },
    ])(
      "should bound the range by the viewer's local days in $zone",
      ({ zone, startDate, endDate }) => {
        setTimeZone(zone);

        expect(
          toDateRangeQuery({
            ...NOTHING,
            start_at: '2026-06-07',
            end_at: '2026-06-30',
          }),
        ).toStrictEqual({
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        });
      },
    );

    it("should land a Classic datetime on the date it names, whatever the viewer's zone", () => {
      setTimeZone('Asia/Tokyo');

      expect(
        toDateRangeQuery({ ...NOTHING, start_at: '2026-06-07T23:59:59-03:00' }),
      ).toStrictEqual({ startDate: new Date('2026-06-06T15:00:00.000Z') });
    });

    it('should end days at 00:00 when the start day has no midnight', () => {
      setTimeZone('America/Havana');

      const range = toDateRangeQuery({
        ...NOTHING,
        start_at: '2026-03-08',
        days: '1',
      });

      expect(range).toStrictEqual({
        startDate: new Date('2026-03-08T05:00:00.000Z'),
        endDate: new Date('2026-03-09T04:00:00.000Z'),
      });
      expect(range.endDate?.getHours()).toBe(0);
    });
  });
});
