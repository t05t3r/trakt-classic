import { describe, expect, it } from 'vitest';
import { flooredPercent } from './flooredPercent.ts';

describe('util: flooredPercent', () => {
  it.each([
    { value: 10, total: 18, expected: 55 },
    { value: 545, total: 783, expected: 69 },
    { value: 29, total: 100, expected: 29 },
    { value: 1, total: 200, expected: 0 },
    { value: 3, total: 3, expected: 100 },
  ])(
    'should floor $value of $total to $expected',
    ({ value, total, expected }) => {
      expect(flooredPercent({ value, total })).toBe(expected);
    },
  );

  it('should read a zero total as 0', () => {
    expect(flooredPercent({ value: 5, total: 0 })).toBe(0);
  });

  it('should cap at 100 when the value is over the total', () => {
    expect(flooredPercent({ value: 18, total: 17 })).toBe(100);
  });

  it('should hold at 0 when the value is negative', () => {
    expect(flooredPercent({ value: -2, total: 10 })).toBe(0);
  });
});
