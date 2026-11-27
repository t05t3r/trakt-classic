import { describe, expect, it } from 'vitest';
import { toggleSeasonExpansion } from './toggleSeasonExpansion.ts';

describe('util: toggleSeasonExpansion', () => {
  it('should open a closed season', () => {
    expect(
      toggleSeasonExpansion({ expansion: new Set([1]), season: 3 }),
    ).toEqual(new Set([1, 3]));
  });

  it('should close an open season', () => {
    expect(
      toggleSeasonExpansion({ expansion: new Set([1, 3]), season: 1 }),
    ).toEqual(new Set([3]));
  });

  it('should keep every season open as a set, never as all', () => {
    expect(
      toggleSeasonExpansion({ expansion: new Set([1, 3]), season: 2 }),
    ).toEqual(new Set([1, 2, 3]));
  });
});
