import { describe, expect, it } from 'vitest';
import { toRatingLabel } from './toRatingLabel.ts';

describe('util: toRatingLabel', () => {
  it.each(
    [
      [1, 'Weak Sauce :('],
      [8, 'Great'],
      [10, 'Totally Ninja!'],
    ] as const,
  )('should label a rating of %i as %s', (rating, label) => {
    expect(toRatingLabel(rating)).toBe(label);
  });

  it.each([0, -1, 11])('should label a rating of %i as nothing', (rating) => {
    expect(toRatingLabel(rating)).toBe('');
  });
});
