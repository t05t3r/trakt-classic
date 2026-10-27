import { describe, expect, it } from 'vitest';
import { isEmpty } from './isEmpty.ts';

describe('isEmpty', () => {
  it('should be true for an array with no entries', () => {
    expect(isEmpty([])).toBe(true);
  });

  it('should be false for an array with one entry', () => {
    expect(isEmpty(['a'])).toBe(false);
  });

  it('should be false for an array whose only entry is undefined', () => {
    expect(isEmpty([undefined])).toBe(false);
  });
});
