import { time } from '$lib/utils/timing/time.ts';
import { describe, expect, it } from 'vitest';
import { hasTargetAired } from './hasTargetAired.ts';

const inHours = (hours: number) => new Date(Date.now() + time.hours(hours));

describe('hasTargetAired', () => {
  it('should read a Target that aired as aired', () => {
    expect(hasTargetAired({ type: 'movie', airDate: inHours(-1) })).toBe(true);
  });

  it('should read a Target that has not aired as not aired', () => {
    expect(
      hasTargetAired({
        type: 'show',
        airDate: inHours(1),
        episode: { count: 1 },
      }),
    ).toBe(false);
  });

  it.each([{ airDate: null }, { airDate: undefined }])(
    'should read a Target whose air date is $airDate as not aired',
    ({ airDate }) => {
      expect(hasTargetAired({ type: 'movie', airDate })).toBe(false);
    },
  );

  it('should read an episode that airs within a day as aired', () => {
    expect(hasTargetAired({ type: 'episode', airDate: inHours(1) })).toBe(true);
  });

  it.each([{ hours: -1 }, { hours: 1 }])(
    'should read a season with no aired episodes, airing in $hours h, as not aired',
    ({ hours }) => {
      expect(
        hasTargetAired({
          type: 'season',
          airDate: inHours(hours),
          episodes: { aired: 0 },
        }),
      ).toBe(false);
    },
  );

  it.each([{ hours: -1 }, { hours: 1 }])(
    'should read a show with no aired episodes, airing in $hours h, as not aired',
    ({ hours }) => {
      expect(
        hasTargetAired({
          type: 'show',
          airDate: inHours(hours),
          episode: { count: 0 },
        }),
      ).toBe(false);
    },
  );

  it('should read a show whose aired episode count is unknown, airing 1 h ago, as aired', () => {
    expect(
      hasTargetAired({
        type: 'show',
        airDate: inHours(-1),
        episode: { count: NaN },
      }),
    ).toBe(true);
  });
});
