import { MAX_DATE } from '$lib/utils/MAX_DATE.ts';
import { describe, expect, it } from 'vitest';
import { isRatingShown } from './isRatingShown.ts';

describe('util: isRatingShown', () => {
  const now = new Date('2026-09-30T12:00:00Z');
  const released = new Date('2026-09-01T00:00:00Z');
  const future = new Date('2026-10-01T00:00:00Z');

  describe('without early ratings', () => {
    const displayEarlyRatings = false;

    it('should show the rating of a released title', () => {
      expect(
        isRatingShown({
          rating: 0.74,
          earliestReleaseDate: released,
          now,
          displayEarlyRatings,
        }),
      ).toBe(true);
    });

    it('should show a rating of 0', () => {
      expect(
        isRatingShown({
          rating: 0,
          earliestReleaseDate: released,
          now,
          displayEarlyRatings,
        }),
      ).toBe(true);
    });

    it('should hide a missing rating', () => {
      expect(
        isRatingShown({
          rating: null,
          earliestReleaseDate: released,
          now,
          displayEarlyRatings,
        }),
      ).toBe(false);
      expect(
        isRatingShown({
          rating: undefined,
          earliestReleaseDate: released,
          now,
          displayEarlyRatings,
        }),
      ).toBe(false);
    });

    it('should hide the rating of a title released in the future', () => {
      expect(
        isRatingShown({
          rating: 0.74,
          earliestReleaseDate: future,
          now,
          displayEarlyRatings,
        }),
      ).toBe(false);
    });

    it('should hide the rating of a title without a release date', () => {
      expect(
        isRatingShown({
          rating: 0.74,
          earliestReleaseDate: MAX_DATE,
          now,
          displayEarlyRatings,
        }),
      ).toBe(false);
    });
  });

  describe('with early ratings', () => {
    const displayEarlyRatings = true;

    it('should show the rating of a title released in the future', () => {
      expect(
        isRatingShown({
          rating: 0.74,
          earliestReleaseDate: future,
          now,
          displayEarlyRatings,
        }),
      ).toBe(true);
    });

    it('should show the rating of a title without a release date', () => {
      expect(
        isRatingShown({
          rating: 0.74,
          earliestReleaseDate: MAX_DATE,
          now,
          displayEarlyRatings,
        }),
      ).toBe(true);
    });

    it('should hide a missing rating', () => {
      expect(
        isRatingShown({
          rating: null,
          earliestReleaseDate: future,
          now,
          displayEarlyRatings,
        }),
      ).toBe(false);
      expect(
        isRatingShown({
          rating: undefined,
          earliestReleaseDate: MAX_DATE,
          now,
          displayEarlyRatings,
        }),
      ).toBe(false);
    });
  });
});
