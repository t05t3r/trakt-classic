import type { CalendarEntry } from '$lib/requests/models/CalendarEntry.ts';
import { EpisodeSiloMappedMock } from '$mocks/data/summary/episodes/silo/mapped/EpisodeSiloMappedMock.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { EpisodeComputedType } from '$lib/requests/models/EpisodeType.ts';
import type { ScheduleDay } from '$lib/features/dashboard/models/ScheduleDay.ts';
import { toLineKey } from '$lib/features/dashboard/toLineKey.ts';
import { subtractDays } from '$lib/utils/date/subtractDays.ts';
import { episodeAt } from '$test/beds/calendar/episodeAt.ts';
import { movieOn } from '$test/beds/calendar/movieOn.ts';
import { setTimeZone } from '$test/beds/date/setTimeZone.ts';
import { describe, expect, it } from 'vitest';
import { toScheduleDays } from './toScheduleDays.ts';

function showEpisodeAt(
  { showId, id, airsAt }: { showId: number; id: number; airsAt: string },
): CalendarEntry {
  return {
    ...episodeAt(id, airsAt),
    show: { ...ShowSiloMappedMock, id: showId },
  };
}

function keysOf(days: ReadonlyArray<ScheduleDay>) {
  return days.map(({ key, items }) => ({
    key,
    lines: items.map(toLineKey),
  }));
}

function scheduleFromYesterday(
  { entries, today }: { entries: ReadonlyArray<CalendarEntry>; today: Date },
) {
  return toScheduleDays({
    entries,
    today,
    start: subtractDays(today, 1),
    days: 21,
  });
}

describe('toScheduleDays', () => {
  it('should keep the first five dates with entries from today', () => {
    const days = scheduleFromYesterday({
      entries: [
        episodeAt(1, '2026-07-06T12:00:00.000Z'),
        episodeAt(2, '2026-07-07T12:00:00.000Z'),
        movieOn(3, '2026-07-09'),
        episodeAt(4, '2026-07-10T12:00:00.000Z'),
        movieOn(5, '2026-07-12'),
        episodeAt(6, '2026-07-15T12:00:00.000Z'),
        episodeAt(7, '2026-07-17T12:00:00.000Z'),
      ],
      today: new Date('2026-07-07T15:00:00.000Z'),
    });

    expect(keysOf(days)).toEqual([
      { key: '2026-07-07', lines: ['episode-2'] },
      { key: '2026-07-09', lines: ['movie-3'] },
      { key: '2026-07-10', lines: ['episode-4'] },
      { key: '2026-07-12', lines: ['movie-5'] },
      { key: '2026-07-15', lines: ['episode-6'] },
    ]);
  });

  it('should keep fewer than five dates when the window holds fewer', () => {
    const days = scheduleFromYesterday({
      entries: [
        movieOn(1, '2026-07-08'),
        episodeAt(2, '2026-07-20T12:00:00.000Z'),
      ],
      today: new Date('2026-07-07T15:00:00.000Z'),
    });

    expect(keysOf(days)).toEqual([
      { key: '2026-07-08', lines: ['movie-1'] },
      { key: '2026-07-20', lines: ['episode-2'] },
    ]);
  });

  it('should keep only the dates of the window it is given', () => {
    const today = new Date('2026-07-07T15:00:00.000Z');

    const days = toScheduleDays({
      entries: [
        episodeAt(1, '2026-07-07T18:00:00.000Z'),
        episodeAt(2, '2026-07-09T12:00:00.000Z'),
      ],
      today,
      start: subtractDays(today, 1),
      days: 3,
    });

    expect(keysOf(days)).toEqual([
      { key: '2026-07-07', lines: ['episode-1'] },
    ]);
  });

  it('should drop a line that repeats one already in its day', () => {
    const days = scheduleFromYesterday({
      entries: [
        episodeAt(1, '2026-07-08T01:00:00.000Z'),
        movieOn(2, '2026-07-08'),
        episodeAt(1, '2026-07-08T01:00:00.000Z'),
        movieOn(2, '2026-07-08'),
      ],
      today: new Date('2026-07-07T15:00:00.000Z'),
    });

    expect(keysOf(days)).toEqual([
      { key: '2026-07-08', lines: ['episode-1', 'movie-2'] },
    ]);
  });

  it('should read no dates when nothing falls from today on', () => {
    const days = scheduleFromYesterday({
      entries: [episodeAt(1, '2026-07-06T12:00:00.000Z')],
      today: new Date('2026-07-07T15:00:00.000Z'),
    });

    expect(days).toEqual([]);
  });

  describe('across a local-day boundary', () => {
    const entries = [
      episodeAt(1, '2026-07-06T20:00:00.000Z'),
      episodeAt(2, '2026-07-07T02:00:00.000Z'),
      episodeAt(3, '2026-07-07T20:00:00.000Z'),
    ];

    it('should drop the entries of the local yesterday west of UTC', () => {
      setTimeZone('America/New_York');

      const days = scheduleFromYesterday({
        entries,
        today: new Date(2026, 6, 7, 12),
      });

      expect(keysOf(days)).toEqual([
        { key: '2026-07-07', lines: ['episode-3'] },
      ]);
    });

    it('should keep the entries of the local today east of UTC', () => {
      setTimeZone('Asia/Tokyo');

      const days = scheduleFromYesterday({
        entries,
        today: new Date(2026, 6, 7, 12),
      });

      expect(keysOf(days)).toEqual([
        { key: '2026-07-07', lines: ['episode-1', 'episode-2'] },
        { key: '2026-07-08', lines: ['episode-3'] },
      ]);
    });
  });

  describe('for a grouped row', () => {
    it("should expand its episodes into one line each at the row's air time", () => {
      const airsAt = '2026-07-08T01:00:00.000Z';
      const first = { ...EpisodeSiloMappedMock, id: 11, key: 'episode-11' };
      const second = { ...EpisodeSiloMappedMock, id: 12, key: 'episode-12' };
      const row: CalendarEntry = {
        kind: 'episode',
        show: ShowSiloMappedMock,
        episode: {
          ...first,
          type: EpisodeComputedType.multiple_episodes,
        },
        episodes: [first, second],
        airsAt: new Date(airsAt),
      };

      const days = scheduleFromYesterday({
        entries: [row],
        today: new Date('2026-07-07T15:00:00.000Z'),
      });

      expect(days).toEqual([
        {
          key: '2026-07-08',
          date: new Date(2026, 6, 8),
          items: [episodeAt(11, airsAt), episodeAt(12, airsAt)],
        },
      ]);
    });

    it('should keep a full season row without episodes as one line', () => {
      const row: CalendarEntry = {
        kind: 'episode',
        show: ShowSiloMappedMock,
        episode: {
          ...EpisodeSiloMappedMock,
          type: EpisodeComputedType.full_season,
        },
        airsAt: new Date('2026-07-08T01:00:00.000Z'),
      };

      const days = scheduleFromYesterday({
        entries: [row],
        today: new Date('2026-07-07T15:00:00.000Z'),
      });

      expect(days).toEqual([
        { key: '2026-07-08', date: new Date(2026, 6, 8), items: [row] },
      ]);
    });

    it('should keep a row with an empty episode list as one line', () => {
      const line = episodeAt(1, '2026-07-08T01:00:00.000Z');

      const days = scheduleFromYesterday({
        entries: [{ ...line, episodes: [] }],
        today: new Date('2026-07-07T15:00:00.000Z'),
      });

      expect(days).toEqual([
        { key: '2026-07-08', date: new Date(2026, 6, 8), items: [line] },
      ]);
    });
  });

  it('should order same-time episodes by show, after earlier ones, then the movies by id', () => {
    const days = scheduleFromYesterday({
      entries: [
        movieOn(9, '2026-07-08'),
        showEpisodeAt({
          showId: 30,
          id: 1,
          airsAt: '2026-07-08T04:00:00.000Z',
        }),
        showEpisodeAt({
          showId: 10,
          id: 2,
          airsAt: '2026-07-08T04:00:00.000Z',
        }),
        movieOn(3, '2026-07-08'),
        showEpisodeAt({
          showId: 40,
          id: 4,
          airsAt: '2026-07-08T02:00:00.000Z',
        }),
        showEpisodeAt({
          showId: 20,
          id: 5,
          airsAt: '2026-07-08T04:00:00.000Z',
        }),
      ],
      today: new Date('2026-07-07T15:00:00.000Z'),
    });

    expect(keysOf(days)).toEqual([
      {
        key: '2026-07-08',
        lines: [
          'episode-4',
          'episode-2',
          'episode-5',
          'episode-1',
          'movie-3',
          'movie-9',
        ],
      },
    ]);
  });
});
