import { describe, expect, it } from 'vitest';
import { toHumanPatternDate } from './toHumanPatternDate.ts';

const DATE = new Date('2026-07-06T20:04:00Z');

describe('util: toHumanPatternDate', () => {
  it('should format the date in each pattern', () => {
    expect(toHumanPatternDate(DATE, 'd MMM')).toBe('6 Jul');
    expect(toHumanPatternDate(DATE, 'd MMM yyyy')).toBe('6 Jul 2026');
    expect(toHumanPatternDate(DATE, 'd MMM yyyy HH:mm')).toBe(
      '6 Jul 2026 20:04',
    );
    expect(toHumanPatternDate(DATE, 'd MMMM yyyy')).toBe('6 July 2026');
    expect(toHumanPatternDate(DATE, 'd MMMM yyyy HH:mm')).toBe(
      '6 July 2026 20:04',
    );
    expect(toHumanPatternDate(DATE, 'EEEE')).toBe('Monday');
    expect(toHumanPatternDate(DATE, 'd')).toBe('6');
    expect(toHumanPatternDate(DATE, 'HH:mm')).toBe('20:04');
    expect(toHumanPatternDate(DATE, 'MMMM d')).toBe('July 6');
  });

  it('should return an empty string for an invalid date', () => {
    expect(toHumanPatternDate(new Date(NaN), 'd MMM')).toBe('');
  });

  it('should fall back to en for a locale the app does not ship', () => {
    expect(toHumanPatternDate(DATE, 'd MMMM yyyy', 'de-DE')).toBe(
      '6 July 2026',
    );
  });
});
