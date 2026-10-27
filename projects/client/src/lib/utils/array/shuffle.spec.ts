import { describe, expect, it } from 'vitest';
import { shuffle } from './shuffle.ts';

describe('shuffle', () => {
  it('should return an array of the same length', () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffle(input);
    expect(result).toHaveLength(input.length);
  });

  it('should return all original elements, usually in a different order', () => {
    const input = [1, 2, 3, 4, 5];
    let differentOrderFound = false;

    // Run multiple times to account for random chance of same order
    for (let i = 0; i < 100; i++) {
      const result = shuffle(input);
      if (!result.every((val, idx) => val === input[idx])) {
        differentOrderFound = true;
        break;
      }
    }

    expect(differentOrderFound).toBe(true);
  });

  it('should contain all original elements', () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffle(input);
    expect(result).toEqual(expect.arrayContaining(input));
  });

  it('should not modify original array', () => {
    const input = [1, 2, 3, 4, 5];
    const original = [...input];
    shuffle(input);
    expect(input).toEqual(original);
  });

  it('should handle empty array', () => {
    const input: number[] = [];
    const result = shuffle(input);
    expect(result).toEqual([]);
  });

  it('should handle single element array', () => {
    const input = [1];
    const result = shuffle(input);
    expect(result).toEqual([1]);
  });
});
