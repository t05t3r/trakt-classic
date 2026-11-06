import { describe, expect, it } from 'vitest';
import { toRateThisLabel } from './toRateThisLabel.ts';

describe('util: toRateThisLabel', () => {
  it.each(
    [
      ['movie', 'Rate this movie'],
      ['show', 'Rate this show'],
      ['season', 'Rate this season'],
      ['episode', 'Rate this episode'],
    ] as const,
  )('should prompt for a %s with %s', (type, label) => {
    expect(toRateThisLabel(type)).toBe(label);
  });
});
