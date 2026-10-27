import { describe, expect, it } from 'vitest';
import { nonNegativeFinite } from './nonNegativeFinite.ts';

describe('util: nonNegativeFinite', () => {
  it('should keep a finite value that is not negative', () => {
    expect(nonNegativeFinite(0)).toBe(0);
    expect(nonNegativeFinite(52.5)).toBe(52.5);
  });

  it('should give 0 for a negative value', () => {
    expect(nonNegativeFinite(-5)).toBe(0);
  });

  it('should give 0 for a value that is not finite', () => {
    expect(nonNegativeFinite(NaN)).toBe(0);
    expect(nonNegativeFinite(Infinity)).toBe(0);
  });
});
