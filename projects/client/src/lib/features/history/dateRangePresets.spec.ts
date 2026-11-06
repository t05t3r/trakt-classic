import { setTimeZone } from '$test/beds/date/setTimeZone.ts';
import { describe, expect, it } from 'vitest';
import { dateRangePresets } from './dateRangePresets.ts';

const LABELS = [
  'Last 7 days',
  'Last 30 days',
  'This month',
  'Last month',
  'This year',
];

const days = (today: Date) =>
  dateRangePresets(today).map(({ start, end }) => [start, end]);

describe('util: dateRangePresets', () => {
  it('should offer the five presets in order, each with its own key', () => {
    const presets = dateRangePresets(new Date(2026, 5, 15, 12));

    expect(presets.map(({ label }) => label)).toEqual(LABELS);
    expect(new Set(presets.map(({ key }) => key)).size).toBe(LABELS.length);
  });

  // 03:00 UTC on 1 April is still the evening of 31 March in Los Angeles.
  it.each(
    [
      {
        zone: 'America/Los_Angeles',
        expected: [
          ['2026-03-25', '2026-03-31'],
          ['2026-03-02', '2026-03-31'],
          ['2026-03-01', '2026-03-31'],
          ['2026-02-01', '2026-02-28'],
          ['2026-01-01', '2026-03-31'],
        ],
      },
      {
        zone: 'Asia/Tokyo',
        expected: [
          ['2026-03-26', '2026-04-01'],
          ['2026-03-03', '2026-04-01'],
          ['2026-04-01', '2026-04-01'],
          ['2026-03-01', '2026-03-31'],
          ['2026-01-01', '2026-04-01'],
        ],
      },
    ],
  )('should count local days in $zone', ({ zone, expected }) => {
    setTimeZone(zone);

    expect(days(new Date('2026-04-01T03:00:00Z'))).toEqual(expected);
  });

  it.each(
    [
      {
        name: 'the year before on 1 January',
        today: [2026, 0, 1],
        lastMonth: ['2025-12-01', '2025-12-31'],
      },
      {
        name: 'a leap February on 31 March',
        today: [2024, 2, 31],
        lastMonth: ['2024-02-01', '2024-02-29'],
      },
      {
        name: 'a 31-day month from a 30-day one',
        today: [2026, 3, 30],
        lastMonth: ['2026-03-01', '2026-03-31'],
      },
    ] as const,
  )('should end last month in $name', ({ today, lastMonth }) => {
    setTimeZone('America/Los_Angeles');
    const [year, month, day] = today;

    expect(days(new Date(year, month, day, 12)).at(3)).toEqual(lastMonth);
  });

  it('should cross a month and a year back for the rolling windows', () => {
    setTimeZone('Asia/Tokyo');

    const [lastSeven, lastThirty] = days(new Date(2026, 0, 3, 12));

    expect(lastSeven).toEqual(['2025-12-28', '2026-01-03']);
    expect(lastThirty).toEqual(['2025-12-05', '2026-01-03']);
  });

  it('should count whole days across a clock change', () => {
    setTimeZone('America/Los_Angeles');

    const [lastSeven] = days(new Date(2026, 2, 10, 0, 30));

    expect(lastSeven).toEqual(['2026-03-04', '2026-03-10']);
  });
});
