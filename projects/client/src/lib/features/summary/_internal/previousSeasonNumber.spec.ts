import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { ShowSiloSeasonsMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloSeasonsMappedMock.ts';
import { describe, expect, it } from 'vitest';
import { previousSeasonNumber } from './previousSeasonNumber.ts';

const SEASONS = ShowSiloSeasonsMappedMock;

const seasonNumbered = (number: number) => ({
  ...assertDefined(SEASONS.at(0)),
  number,
});

describe('previousSeasonNumber', () => {
  it('should take the season before the given one', () => {
    expect(previousSeasonNumber({ seasons: SEASONS, season: 3 })).toBe(2);
  });

  it('should take the season before the given one, whatever the order', () => {
    const seasons = SEASONS.toReversed();

    expect(previousSeasonNumber({ seasons, season: 3 })).toBe(2);
  });

  it('should reach past a missing season number', () => {
    const seasons = [seasonNumbered(1), seasonNumbered(3)];

    expect(previousSeasonNumber({ seasons, season: 3 })).toBe(1);
  });

  it('should pass over a season with no episodes', () => {
    const seasons = [
      seasonNumbered(1),
      { ...seasonNumbered(2), episodes: { count: 0, aired: 0 } },
      seasonNumbered(3),
    ];

    expect(previousSeasonNumber({ seasons, season: 3 })).toBe(1);
  });

  it('should pass over the specials', () => {
    const seasons = [seasonNumbered(0), ...SEASONS];

    expect(previousSeasonNumber({ seasons, season: 1 })).toBeUndefined();
  });

  it('should find none without a season before the given one', () => {
    expect(previousSeasonNumber({ seasons: SEASONS, season: 1 }))
      .toBeUndefined();
  });
});
