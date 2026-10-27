import { SPECIALS } from '$lib/utils/media/SPECIALS.ts';
import type { Season } from '$lib/requests/models/Season.ts';
import { MAX_DATE } from '$lib/utils/MAX_DATE.ts';
import { ShowSiloSeasonsMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloSeasonsMappedMock.ts';
import { describe, expect, it } from 'vitest';
import { firstSeasonNumber } from './firstSeasonNumber.ts';

function season(
  { number, count = 10 }: { number: number; count?: number },
): Season {
  return {
    id: number,
    key: `season-${number}`,
    number,
    title: null,
    episodes: { count, aired: count },
    airDate: MAX_DATE,
    overview: null,
    rating: null,
    network: null,
    totalRuntime: 600,
  };
}

describe('firstSeasonNumber', () => {
  it("should take Silo's first season", () => {
    expect(firstSeasonNumber(ShowSiloSeasonsMappedMock)).toBe(1);
  });

  it('should take the lowest-numbered season, whatever the order', () => {
    const seasons = [season({ number: 3 }), season({ number: 2 })];

    expect(firstSeasonNumber(seasons)).toBe(2);
  });

  it('should pass over the specials while a regular season has episodes', () => {
    const seasons = [season({ number: SPECIALS }), season({ number: 1 })];

    expect(firstSeasonNumber(seasons)).toBe(1);
  });

  it('should pass over a season without episodes', () => {
    const seasons = [
      season({ number: 1, count: 0 }),
      season({ number: 2 }),
    ];

    expect(firstSeasonNumber(seasons)).toBe(2);
  });

  it('should take the specials when no other season has episodes', () => {
    const seasons = [
      season({ number: SPECIALS }),
      season({ number: 1, count: 0 }),
    ];

    expect(firstSeasonNumber(seasons)).toBe(0);
  });

  it('should find none when no season has episodes', () => {
    const seasons = [
      season({ number: SPECIALS, count: 0 }),
      season({ number: 1, count: 0 }),
    ];

    expect(firstSeasonNumber(seasons)).toBeUndefined();
  });
});
