import { MAX_DATE } from '$lib/utils/MAX_DATE.ts';
import { describe, expect, it } from 'vitest';
import { toShownRating } from './toShownRating.ts';

describe('util: toShownRating', () => {
  const now = new Date('2026-09-30T12:00:00Z');
  const released = new Date('2026-09-01T00:00:00Z');

  it('should give a released rating and its percentage', () => {
    expect(
      toShownRating({
        rating: 0.74,
        earliestReleaseDate: released,
        now,
        displayEarlyRatings: false,
      }),
    ).toEqual({ value: 0.74, percent: '74%' });
  });

  it('should give a rating of 0', () => {
    expect(
      toShownRating({
        rating: 0,
        earliestReleaseDate: released,
        now,
        displayEarlyRatings: false,
      }),
    ).toEqual({ value: 0, percent: '0%' });
  });

  it('should give nothing for a missing rating', () => {
    expect(
      toShownRating({
        rating: null,
        earliestReleaseDate: released,
        now,
        displayEarlyRatings: true,
      }),
    ).toBeNull();
  });

  it('should give nothing for an unreleased title', () => {
    expect(
      toShownRating({
        rating: 0.74,
        earliestReleaseDate: MAX_DATE,
        now,
        displayEarlyRatings: false,
      }),
    ).toBeNull();
  });

  it('should give an unreleased rating when early ratings are on', () => {
    expect(
      toShownRating({
        rating: 0.74,
        earliestReleaseDate: MAX_DATE,
        now,
        displayEarlyRatings: true,
      }),
    ).toEqual({ value: 0.74, percent: '74%' });
  });
});
