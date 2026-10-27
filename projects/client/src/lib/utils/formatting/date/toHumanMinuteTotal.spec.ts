import { describe, expect, it } from 'vitest';
import { toHumanMinuteTotal } from './toHumanMinuteTotal.ts';

describe('util: toHumanMinuteTotal', () => {
  it('should show the total as grouped minutes', () => {
    expect(toHumanMinuteTotal(33283)).toBe('33,283m');
  });

  it('should show 0m for zero minutes', () => {
    expect(toHumanMinuteTotal(0)).toBe('0m');
  });

  it('should show 0m for minutes that are not a count', () => {
    expect(toHumanMinuteTotal(NaN)).toBe('0m');
    expect(toHumanMinuteTotal(-5)).toBe('0m');
  });

  it('should format in the given locale', () => {
    expect(toHumanMinuteTotal(52, 'en')).toBe('52m');
  });
});
