import { describe, expect, it } from 'vitest';
import { isProgressComplete } from './isProgressComplete.ts';

describe('util: isProgressComplete', () => {
  it('should return true once every aired episode is watched', () => {
    expect(isProgressComplete({ completed: 17, total: 17 })).toBe(true);
  });

  it('should return false while an aired episode is unwatched', () => {
    expect(isProgressComplete({ completed: 11, total: 17 })).toBe(false);
  });

  it('should return false with no aired episode', () => {
    expect(isProgressComplete({ completed: 0, total: 0 })).toBe(false);
  });
});
