import { describe, expect, it } from 'vitest';
import { nearestNumber } from './nearestNumber.ts';

const NUMBERS = [4, 1, 9, 7, 3];

describe('nearestNumber', () => {
  it('should take the nearest number below the given one, whatever the order', () => {
    expect(nearestNumber({ numbers: NUMBERS, current: 4, side: 'below' }))
      .toBe(3);
  });

  it('should take the nearest number above the given one, whatever the order', () => {
    expect(nearestNumber({ numbers: NUMBERS, current: 4, side: 'above' }))
      .toBe(7);
  });

  it('should take none past the lowest or the highest', () => {
    expect(nearestNumber({ numbers: NUMBERS, current: 1, side: 'below' }))
      .toBeUndefined();
    expect(nearestNumber({ numbers: NUMBERS, current: 9, side: 'above' }))
      .toBeUndefined();
  });
});
