import type {
  GenreShare,
  Last30Day,
  Last30Days,
} from '$lib/features/dashboard/models/Last30Days.ts';
import { setTimeZone } from '$test/beds/date/setTimeZone.ts';
import { describe, expect, it } from 'vitest';
import { toLast30DaysCharts } from './toLast30DaysCharts.ts';

const NONE = { distinct: 0, plays: 0 };

const DRAMA: GenreShare = {
  slug: 'drama',
  share: 68 / 190,
  episodes: { distinct: 66, plays: 70 },
  shows: 6,
  movies: { distinct: 2, plays: 2 },
};

const SCIENCE_FICTION: GenreShare = {
  slug: 'science-fiction',
  share: 0.1,
  episodes: { distinct: 3, plays: 3 },
  shows: 1,
  movies: NONE,
};

const NOW = new Date('2025-02-01T12:00:00.000Z');

function day(
  { key, date }: Pick<Last30Day, 'key' | 'date'>,
  overrides: Partial<Last30Day> = {},
): Last30Day {
  return { key, date, minutes: 0, episodes: NONE, movies: NONE, ...overrides };
}

function last30Days(
  { days = [], genres = [], now = NOW }: {
    days?: ReadonlyArray<Last30Day>;
    genres?: ReadonlyArray<GenreShare>;
    now?: Date;
  },
): Last30Days {
  return {
    days,
    totals: { minutes: 0, episodes: NONE, movies: NONE },
    genres,
    now,
  };
}

describe('toLast30DaysCharts', () => {
  describe('days', () => {
    it("should keep each day's minutes and counts and link it to its history", () => {
      const date = new Date('2025-01-31T00:00:00.000Z');
      const data = last30Days({
        days: [day({ key: '2025-01-31', date }, {
          minutes: 171,
          episodes: { distinct: 1, plays: 2 },
          movies: { distinct: 1, plays: 1 },
        })],
      });

      const { days } = toLast30DaysCharts({ data });

      expect(days).toEqual([{
        key: '2025-01-31',
        date,
        minutes: 171,
        episodes: { distinct: 1, plays: 2 },
        movies: { distinct: 1, plays: 1 },
        href: '/users/me/history?start_at=2025-01-31&days=1',
      }]);
    });

    it("should link a day to its local date's history east of UTC", () => {
      setTimeZone('Asia/Tokyo');
      // Midnight of 31 January in Tokyo, still 30 January in UTC.
      const date = new Date('2025-01-30T15:00:00.000Z');

      const { days } = toLast30DaysCharts({
        data: last30Days({ days: [day({ key: '2025-01-31', date })] }),
      });

      expect(days.map(({ href }) => href)).toEqual([
        '/users/me/history?start_at=2025-01-31&days=1',
      ]);
    });
  });

  describe('genres', () => {
    const genresOf = (genres: ReadonlyArray<GenreShare>, now: Date) =>
      toLast30DaysCharts({ data: last30Days({ genres, now }) }).genres;

    it("should name each genre and link its counts into that type's history", () => {
      const genres = genresOf([DRAMA, SCIENCE_FICTION], NOW);

      expect(genres).toEqual([
        {
          key: 'drama',
          name: 'Drama',
          share: 68 / 190,
          episodes: {
            distinct: 66,
            plays: 70,
            href: '/users/me/history/episodes?genres=drama&start_at=2025-01-02',
          },
          shows: {
            distinct: 6,
            href: '/users/me/history/shows?genres=drama&start_at=2025-01-02',
          },
          movies: {
            distinct: 2,
            plays: 2,
            href: '/users/me/history/movies?genres=drama&start_at=2025-01-02',
          },
        },
        {
          key: 'science-fiction',
          name: 'Science Fiction',
          share: 0.1,
          episodes: {
            distinct: 3,
            plays: 3,
            href:
              '/users/me/history/episodes?genres=science-fiction&start_at=2025-01-02',
          },
          shows: {
            distinct: 1,
            href:
              '/users/me/history/shows?genres=science-fiction&start_at=2025-01-02',
          },
          movies: {
            distinct: 0,
            plays: 0,
            href:
              '/users/me/history/movies?genres=science-fiction&start_at=2025-01-02',
          },
        },
      ]);
    });

    it('should start the genre links at the UTC date of 30 local days ago', () => {
      setTimeZone('Europe/Istanbul');
      // A UTC+3 clock just after 06:00 on 7 July.
      const [drama] = genresOf([DRAMA], new Date('2026-07-07T03:01:39.000Z'));

      expect(drama?.episodes.href).toBe(
        '/users/me/history/episodes?genres=drama&start_at=2026-06-07',
      );
    });

    it('should keep the UTC date east of UTC just after local midnight', () => {
      setTimeZone('Asia/Tokyo');
      // 01:30 on 8 July in Tokyo; 30 days back is 8 June there, 7 June in UTC.
      const [drama] = genresOf([DRAMA], new Date('2026-07-07T16:30:00.000Z'));

      expect(drama?.episodes.href).toBe(
        '/users/me/history/episodes?genres=drama&start_at=2026-06-07',
      );
    });
  });
});
