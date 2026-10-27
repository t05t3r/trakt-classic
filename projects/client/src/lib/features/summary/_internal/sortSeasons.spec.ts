import { SPECIALS } from '$lib/utils/media/SPECIALS.ts';
import type { Season } from '$lib/requests/models/Season.ts';
import { MAX_DATE } from '$lib/utils/MAX_DATE.ts';
import { describe, expect, it } from 'vitest';
import { type SeasonsSort, sortSeasons } from './sortSeasons.ts';

function season(
  { number, rating = null, airDate = MAX_DATE }: {
    number: number;
    rating?: number | null;
    airDate?: Date;
  },
): Season {
  return {
    id: number,
    key: `season-${number}`,
    number,
    title: null,
    episodes: { count: 10, aired: 10 },
    airDate,
    overview: null,
    rating,
    network: null,
    totalRuntime: 600,
  };
}

function numbersOf(
  { seasons, sort }: { seasons: ReadonlyArray<Season>; sort: SeasonsSort },
) {
  return sortSeasons({ items: seasons, sort }).map(({ number }) => number);
}

const BY_NUMBER = [
  season({ number: 2 }),
  season({ number: SPECIALS }),
  season({ number: 1 }),
];

describe('sortSeasons', () => {
  it('should sort by number, highest first', () => {
    expect(numbersOf({
      seasons: BY_NUMBER,
      sort: { by: 'number', how: 'desc' },
    })).toEqual([2, 1, 0]);
  });

  describe('by rating', () => {
    const seasons = [
      season({ number: 1, rating: 0.7 }),
      season({ number: 2 }),
      season({ number: 3, rating: 0.9 }),
      season({ number: 4, rating: 0.8 }),
    ];

    it('should put the highest first and an unrated season last', () => {
      expect(numbersOf({ seasons, sort: { by: 'rating', how: 'desc' } }))
        .toEqual([3, 4, 1, 2]);
    });

    it('should sort a season rated 0 as the number 0', () => {
      const unvoted = [
        season({ number: 1, rating: 0.4 }),
        season({ number: 2, rating: 0 }),
        season({ number: 3, rating: 0.6 }),
      ];

      expect(
        numbersOf({ seasons: unvoted, sort: { by: 'rating', how: 'asc' } }),
      ).toEqual([2, 1, 3]);
    });
  });

  describe('by air date', () => {
    const seasons = [
      season({ number: 1, airDate: new Date('2023-05-05T01:00:00.000Z') }),
      season({ number: 3 }),
      season({ number: 2, airDate: new Date('2024-11-15T02:00:00.000Z') }),
      season({
        number: SPECIALS,
        airDate: new Date('2024-01-01T00:00:00.000Z'),
      }),
    ];

    it('should put the latest first and an unknown date last', () => {
      expect(numbersOf({ seasons, sort: { by: 'aired', how: 'desc' } }))
        .toEqual([2, 0, 1, 3]);
    });

    it('should read a copy of the unknown date as unknown', () => {
      const unaired = [
        season({ number: 5, airDate: new Date(MAX_DATE) }),
        season({ number: 1, airDate: new Date('2023-05-05T01:00:00.000Z') }),
      ];

      expect(
        numbersOf({ seasons: unaired, sort: { by: 'aired', how: 'desc' } }),
      )
        .toEqual([1, 5]);
    });

    it('should read an Invalid Date as unknown', () => {
      const invalid = [
        season({ number: 4, airDate: new Date('not a date') }),
        season({ number: 1, airDate: new Date('2023-05-05T01:00:00.000Z') }),
        season({ number: 2, airDate: new Date('2024-11-15T02:00:00.000Z') }),
      ];

      expect(
        numbersOf({ seasons: invalid, sort: { by: 'aired', how: 'desc' } }),
      ).toEqual([2, 1, 4]);
    });
  });
});
