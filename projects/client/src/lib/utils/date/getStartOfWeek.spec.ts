import { describe, expect, it } from 'vitest';
import { getStartOfWeek } from './getStartOfWeek.ts';

describe('getStartOfWeek', () => {
  it('should handle date at the beginning of the week (Sunday)', () => {
    const sunday = new Date('2023-12-17');
    const result = getStartOfWeek(sunday, 'en');

    expect(result.toDateString()).toBe('Sun Dec 17 2023');
  });

  it('should handle date at the end of the week (Saturday)', () => {
    const saturday = new Date('2023-12-23');
    const result = getStartOfWeek(saturday, 'en');

    expect(result.toDateString()).toBe('Sun Dec 17 2023');
  });

  it('should handle year boundary correctly', () => {
    const newYearDay = new Date('2024-01-01');
    const result = getStartOfWeek(newYearDay, 'en');

    expect(result.toDateString()).toBe('Sun Dec 31 2023');
  });

  it('should start the week as en does for a locale the app does not ship', () => {
    const sunday = new Date('2023-12-17');
    const result = getStartOfWeek(sunday, 'nl-NL');

    expect(result.toDateString()).toBe('Sun Dec 17 2023');
  });
});
