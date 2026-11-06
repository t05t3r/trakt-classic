import { describe, expect, it } from 'vitest';
import { isPositiveIntegerText } from './isPositiveIntegerText.ts';

describe('util: isPositiveIntegerText', () => {
  it.each(['1', '12', '9007199254740991'])('should accept %s', (value) => {
    expect(isPositiveIntegerText(value)).toBe(true);
  });

  it.each([
    '',
    '0',
    '012',
    '-1',
    '1.5',
    '1e3',
    'abc',
    '9007199254740992',
    '1000000000000000000000',
  ])('should refuse "%s"', (value) => {
    expect(isPositiveIntegerText(value)).toBe(false);
  });
});
