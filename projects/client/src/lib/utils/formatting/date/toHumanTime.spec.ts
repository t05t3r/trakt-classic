import { describe, expect, it } from 'vitest';
import { toHumanTime } from './toHumanTime.ts';

describe('toHumanTime', () => {
  const date = new Date('2025-01-06T09:00:00Z');

  it('should fall back to en for locales the app does not ship', () => {
    expect(toHumanTime({ date, locale: 'nl-NL' })).toBe('9:00 AM');
  });

  it('should format time with AM/PM for en', () => {
    const result = toHumanTime({ date, locale: 'en' });

    expect(result).toBe('9:00 AM');
  });

  it('should format midnight as en does for de-DE, which the app does not ship', () => {
    const midnight = new Date('2025-01-06T00:00:00Z');
    const result = toHumanTime({ date: midnight, locale: 'de-DE' });

    expect(result).toBe('12:00 AM');
  });
});
