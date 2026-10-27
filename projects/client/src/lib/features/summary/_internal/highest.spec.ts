import { describe, expect, it } from 'vitest';
import { highest } from './highest.ts';

describe('highest', () => {
  it('should take the highest number, whatever the order', () => {
    expect(highest([4, 1, 9, 7, 3])).toBe(9);
  });

  it('should take none of no numbers', () => {
    expect(highest([])).toBeUndefined();
  });
});
