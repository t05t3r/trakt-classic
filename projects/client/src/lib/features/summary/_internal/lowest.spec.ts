import { describe, expect, it } from 'vitest';
import { lowest } from './lowest.ts';

describe('lowest', () => {
  it('should take the lowest number, whatever the order', () => {
    expect(lowest([4, 1, 9, 7, 3])).toBe(1);
  });

  it('should take none of no numbers', () => {
    expect(lowest([])).toBeUndefined();
  });
});
