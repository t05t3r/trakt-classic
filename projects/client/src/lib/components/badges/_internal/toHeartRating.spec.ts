import { describe, expect, it } from 'vitest';
import { toHeartRating } from './toHeartRating.ts';

describe('util: toHeartRating', () => {
  it('should put ratings under 9.5% in band 0', () => {
    expect(toHeartRating(0)).toBe(0);
    expect(toHeartRating(0.09)).toBe(0);
    expect(toHeartRating(0.094)).toBe(0);
  });

  it('should round to a whole percentage before banding', () => {
    expect(toHeartRating(0.095)).toBe(1);
    expect(toHeartRating(0.195)).toBe(2);
    expect(toHeartRating(0.199)).toBe(2);
    expect(toHeartRating(0.29)).toBe(2);
    expect(toHeartRating(0.994)).toBe(9);
  });

  it('should band each ten percent', () => {
    expect(toHeartRating(0.1)).toBe(1);
    expect(toHeartRating(0.5)).toBe(5);
    expect(toHeartRating(0.74)).toBe(7);
  });

  it('should put 99.5% and up in band 10', () => {
    expect(toHeartRating(0.995)).toBe(10);
    expect(toHeartRating(1)).toBe(10);
  });
});
