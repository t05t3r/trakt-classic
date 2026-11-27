import { describe, expect, it } from 'vitest';
import { clampedShare } from './clampedShare.ts';

describe('util: clampedShare', () => {
  it.each([
    { value: 5, total: 8, expected: 0.625 },
    { value: 0, total: 8, expected: 0 },
    { value: 8, total: 8, expected: 1 },
  ])(
    'should read $value of $total as $expected',
    ({ value, total, expected }) => {
      expect(clampedShare({ value, total })).toBe(expected);
    },
  );

  it('should read a zero total as 0', () => {
    expect(clampedShare({ value: 5, total: 0 })).toBe(0);
  });

  it('should cap at 1 when the value is over the total', () => {
    expect(clampedShare({ value: 18, total: 17 })).toBe(1);
  });

  it('should hold at 0 when the value is negative', () => {
    expect(clampedShare({ value: -2, total: 10 })).toBe(0);
  });
});
