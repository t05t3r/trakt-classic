import { describe, expect, it } from 'vitest';
import { toFlooredPercentage } from './toFlooredPercentage.ts';

describe('util: toFlooredPercentage', () => {
  it.each([
    { value: 545, total: 783, expected: '69%' },
    { value: 33, total: 40, expected: '82%' },
    { value: 3, total: 4, expected: '75%' },
    { value: 1, total: 1, expected: '100%' },
    { value: 29, total: 100, expected: '29%' },
  ])(
    'should read $value of $total as $expected',
    ({ value, total, expected }) => {
      expect(toFlooredPercentage({ value, total })).toBe(expected);
    },
  );

  it('should read a zero total as 0%', () => {
    expect(toFlooredPercentage({ value: 5, total: 0 })).toBe('0%');
  });

  it('should read 100% when the value is over the total', () => {
    expect(toFlooredPercentage({ value: 18, total: 17 })).toBe('100%');
  });

  it('should format in the locale it is given', () => {
    expect(toFlooredPercentage({ value: 545, total: 783 }, 'de')).toBe('69 %');
  });
});
