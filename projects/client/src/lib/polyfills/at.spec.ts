import { describe, expect, it } from 'vitest';
import './at.ts';

describe('Array.prototype.at polyfill', () => {
  it('should return the element at a positive index', () => {
    expect(['a', 'b', 'c'].at(0)).toBe('a');
    expect(['a', 'b', 'c'].at(2)).toBe('c');
  });

  it('should support negative indices', () => {
    expect(['a', 'b', 'c'].at(-1)).toBe('c');
  });

  it('should return undefined when out of range', () => {
    expect(['a'].at(5)).toBeUndefined();
    expect(['a'].at(-5)).toBeUndefined();
  });
});
