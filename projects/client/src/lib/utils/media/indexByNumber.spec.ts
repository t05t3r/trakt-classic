import { describe, expect, it } from 'vitest';
import { indexByNumber } from './indexByNumber.ts';

describe('util: indexByNumber', () => {
  it('should find each item by its number', () => {
    const first = { number: 1, title: 'Freedom Day' };
    const third = { number: 3, title: 'Machines' };

    const index = indexByNumber([first, third]);

    expect(index.get(1)).toBe(first);
    expect(index.get(3)).toBe(third);
    expect(index.get(2)).toBeUndefined();
  });

  it('should hold nothing for no items', () => {
    expect(indexByNumber([]).size).toBe(0);
  });
});
