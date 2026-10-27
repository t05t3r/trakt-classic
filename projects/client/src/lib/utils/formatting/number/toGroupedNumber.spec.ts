import { describe, expect, it } from 'vitest';
import { toGroupedNumber } from './toGroupedNumber.ts';

describe('util: toGroupedNumber', () => {
  it('should group the thousands of 4900 as 4,900', () => {
    expect(toGroupedNumber(4900)).toBe('4,900');
  });

  it('should leave 42 ungrouped', () => {
    expect(toGroupedNumber(42)).toBe('42');
  });

  it('should format 0 as 0', () => {
    expect(toGroupedNumber(0)).toBe('0');
  });
});
