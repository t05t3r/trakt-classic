import { describe, expect, it } from 'vitest';
import { toHumanMinutes } from './toHumanMinutes.ts';

describe('util: toHumanMinutes', () => {
  it('should show the minutes as days, hours and minutes', () => {
    expect(toHumanMinutes(33283)).toBe('23d 2h 43m');
  });

  it('should drop the units that are zero', () => {
    expect(toHumanMinutes(300)).toBe('5h');
  });

  it('should show 0m for zero minutes', () => {
    expect(toHumanMinutes(0)).toBe('0m');
  });

  it('should show 0m for minutes that are not a count', () => {
    expect(toHumanMinutes(NaN)).toBe('0m');
    expect(toHumanMinutes(-5)).toBe('0m');
    expect(toHumanMinutes(Infinity)).toBe('0m');
  });

  it('should format in the given locale', () => {
    expect(toHumanMinutes(52, 'en')).toBe('52m');
  });
});
