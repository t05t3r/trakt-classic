import { describe, expect, it } from 'vitest';
import './hasOwn.ts';

describe('Object.hasOwn polyfill', () => {
  it('should report own properties', () => {
    expect(Object.hasOwn({ a: 1 }, 'a')).toBe(true);
  });

  it('should ignore inherited properties', () => {
    expect(Object.hasOwn({}, 'toString')).toBe(false);
  });

  it('should report own properties holding undefined', () => {
    expect(Object.hasOwn({ a: undefined }, 'a')).toBe(true);
  });

  it('should report array indices', () => {
    expect(Object.hasOwn(['a'], 0)).toBe(true);
    expect(Object.hasOwn(['a'], 1)).toBe(false);
  });
});
