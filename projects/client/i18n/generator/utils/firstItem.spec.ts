import { describe, expect, it } from 'vitest';
import { firstItem } from './firstItem.ts';

describe('firstItem', () => {
  it('should return the first item of a non-empty list', () => {
    expect(firstItem(['en', 'de', 'fr'])).toBe('en');
  });

  it('should throw on an empty list', () => {
    expect(() => firstItem([])).toThrow('Expected at least one result');
  });
});
