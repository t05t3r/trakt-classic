import { describe, expect, it } from 'vitest';
import { getLatestDate } from './getLatestDate.ts';

describe('getLatestDate', () => {
  it('should return the latest date, whatever the order', () => {
    const dates = [
      new Date('2024-02-10T20:00:00.000Z'),
      new Date('2024-03-10T20:00:00.000Z'),
      new Date('2024-01-10T20:00:00.000Z'),
    ];

    expect(getLatestDate(dates)).toEqual(new Date('2024-03-10T20:00:00.000Z'));
  });

  it('should compare by time when the ISO strings differ in precision', () => {
    const dates = [
      new Date('2024-03-10T20:00:26Z'),
      new Date('2024-03-10T20:00:26.500Z'),
      new Date('2024-03-10T20:00:25.900Z'),
    ];

    expect(getLatestDate(dates)).toEqual(new Date('2024-03-10T20:00:26.500Z'));
  });

  it('should return undefined for no dates', () => {
    expect(getLatestDate([])).toBeUndefined();
  });
});
