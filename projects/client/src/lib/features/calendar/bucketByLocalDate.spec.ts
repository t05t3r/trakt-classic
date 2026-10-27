import type { CalendarEntry } from '$lib/requests/models/CalendarEntry.ts';
import type { WindowDay } from '$lib/utils/date/bucketByWindowDay.ts';
import { episodeAt } from '$test/beds/calendar/episodeAt.ts';
import { movieOn } from '$test/beds/calendar/movieOn.ts';
import { setTimeZone } from '$test/beds/date/setTimeZone.ts';
import { describe, expect, it } from 'vitest';
import { bucketByLocalDate } from './bucketByLocalDate.ts';

function entriesOf(days: ReadonlyArray<WindowDay<CalendarEntry>>) {
  return days.map(({ key, items }) => ({
    key,
    entries: items.map((entry) =>
      entry.kind === 'episode' ? entry.episode.key : entry.movie.key
    ),
  }));
}

describe('bucketByLocalDate', () => {
  it('should keep a padded day key for every day of the range, empty days included', () => {
    const buckets = bucketByLocalDate({
      entries: [],
      start: new Date(2026, 8, 8),
      days: 3,
    });

    expect(entriesOf(buckets)).toEqual([
      { key: '2026-09-08', entries: [] },
      { key: '2026-09-09', entries: [] },
      { key: '2026-09-10', entries: [] },
    ]);
  });

  it('should order a day by air time, then put its movies after the episodes', () => {
    const buckets = bucketByLocalDate({
      entries: [
        movieOn(1, '2026-07-10'),
        episodeAt(2, '2026-07-10T20:00:00.000Z'),
        episodeAt(3, '2026-07-10T08:00:00.000Z'),
      ],
      start: new Date(2026, 6, 10),
      days: 1,
    });

    expect(entriesOf(buckets)).toEqual([
      { key: '2026-07-10', entries: ['episode-3', 'episode-2', 'movie-1'] },
    ]);
  });

  it.each([
    { firstEpisode: 4, secondEpisode: 5, firstMovie: 6, secondMovie: 7 },
    { firstEpisode: 5, secondEpisode: 4, firstMovie: 7, secondMovie: 6 },
  ])(
    'should keep the input order of ties: episodes $firstEpisode, $secondEpisode and movies $firstMovie, $secondMovie',
    ({ firstEpisode, secondEpisode, firstMovie, secondMovie }) => {
      const buckets = bucketByLocalDate({
        entries: [
          movieOn(firstMovie, '2026-07-10'),
          episodeAt(firstEpisode, '2026-07-10T04:00:00.000Z'),
          movieOn(secondMovie, '2026-07-10'),
          episodeAt(secondEpisode, '2026-07-10T04:00:00.000Z'),
        ],
        start: new Date(2026, 6, 10),
        days: 1,
      });

      expect(entriesOf(buckets)).toEqual([
        {
          key: '2026-07-10',
          entries: [
            `episode-${firstEpisode}`,
            `episode-${secondEpisode}`,
            `movie-${firstMovie}`,
            `movie-${secondMovie}`,
          ],
        },
      ]);
    },
  );

  it('should drop entries outside the range', () => {
    const buckets = bucketByLocalDate({
      entries: [
        episodeAt(1, '2026-07-09T23:00:00.000Z'),
        episodeAt(2, '2026-07-10T12:00:00.000Z'),
        movieOn(3, '2026-07-12'),
      ],
      start: new Date(2026, 6, 10),
      days: 2,
    });

    expect(entriesOf(buckets)).toEqual([
      { key: '2026-07-10', entries: ['episode-2'] },
      { key: '2026-07-11', entries: [] },
    ]);
  });

  describe('across a local-day boundary', () => {
    const entries = [
      episodeAt(1, '2026-07-10T02:00:00.000Z'),
      episodeAt(2, '2026-07-10T20:00:00.000Z'),
      movieOn(3, '2026-07-10'),
    ];

    it('should bucket by the day west of UTC', () => {
      setTimeZone('America/New_York');

      const buckets = bucketByLocalDate({
        entries,
        start: new Date(2026, 6, 9),
        days: 3,
      });

      expect(entriesOf(buckets)).toEqual([
        { key: '2026-07-09', entries: ['episode-1'] },
        { key: '2026-07-10', entries: ['episode-2', 'movie-3'] },
        { key: '2026-07-11', entries: [] },
      ]);
    });

    it('should bucket by the day east of UTC', () => {
      setTimeZone('Asia/Tokyo');

      const buckets = bucketByLocalDate({
        entries,
        start: new Date(2026, 6, 9),
        days: 3,
      });

      expect(entriesOf(buckets)).toEqual([
        { key: '2026-07-09', entries: [] },
        { key: '2026-07-10', entries: ['episode-1', 'movie-3'] },
        { key: '2026-07-11', entries: ['episode-2'] },
      ]);
    });
  });
});
