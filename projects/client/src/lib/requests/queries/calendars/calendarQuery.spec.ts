import { useQuery } from '$lib/features/query/useQuery.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { CalendarMediaMappedMock } from '$mocks/data/calendars/mapped/CalendarMediaMappedMock.ts';
import { CalendarMediaResponseMock } from '$mocks/data/calendars/response/CalendarMediaResponseMock.ts';
import { CALENDAR_URL } from '$mocks/data/calendars/CALENDAR_URL.ts';
import { server } from '$mocks/server.ts';
import { EpisodeSiloResponseMock } from '$mocks/data/summary/episodes/silo/response/EpisodeSiloResponseMock.ts';
import { MovieHereticResponseMock } from '$mocks/data/summary/movies/heretic/response/MovieHereticResponseMock.ts';
import { ShowSiloResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloResponseMock.ts';
import { serveCalendarRows } from '$test/beds/calendar/serveCalendarRows.ts';
import { createTestBedQuery } from '$test/beds/query/createTestBedQuery.ts';
import { observeInvalidation } from '$test/beds/query/observeInvalidation.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import type { HotReleaseResponse } from '@trakt/api';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { calendarQuery } from './calendarQuery.ts';

const EPISODE_ROW: HotReleaseResponse = {
  first_aired: '2023-05-05T01:00:00.000Z',
  episode: EpisodeSiloResponseMock,
  show: ShowSiloResponseMock,
};

const MOVIE_ROW: HotReleaseResponse = {
  released: '2024-11-08',
  movie: MovieHereticResponseMock,
};

const MY_SHOWS_AND_MOVIES = calendarQuery({
  target: 'my',
  tab: 'shows-movies',
  startDate: '2026-07-06',
  days: 21,
});

async function readCalendar() {
  const result = await runQuery({
    factory: () => createTestBedQuery(MY_SHOWS_AND_MOVIES),
    waitFor: (result) => result.isSuccess,
  });

  return result.data;
}

describe('calendarQuery', () => {
  it('should request the media calendar for the target and the range', async () => {
    const requestedUrls: URL[] = [];
    server.use(
      http.get(CALENDAR_URL, ({ request }) => {
        requestedUrls.push(new URL(request.url));
        return HttpResponse.json(CalendarMediaResponseMock);
      }),
    );

    await readCalendar();

    const requestedUrl = requestedUrls.at(-1);
    expect(requestedUrl?.pathname).toBe('/calendars/my/media/2026-07-06/21');
    expect(requestedUrl?.searchParams.get('extended')).toBe('full,images');
    expect(requestedUrl?.searchParams.get('group')).toBe('day');
  });

  it('should map episode and movie rows to calendar entries', async () => {
    const result = await readCalendar();

    expect(result).toEqual(CalendarMediaMappedMock);
  });

  it('should map an episode row whose movie key is null', async () => {
    serveCalendarRows([{ ...EPISODE_ROW, movie: null, released: null }]);

    const result = await readCalendar();

    expect(result).toEqual(CalendarMediaMappedMock.slice(0, 1));
  });

  it('should drop an episode row without a show', async () => {
    serveCalendarRows([{ ...EPISODE_ROW, show: null }, MOVIE_ROW]);

    const result = await readCalendar();

    expect(result?.map((entry) => entry.kind)).toEqual(['movie']);
  });

  it('should drop a movie row without a release date', async () => {
    serveCalendarRows([EPISODE_ROW, { ...MOVIE_ROW, released: null }]);

    const result = await readCalendar();

    expect(result?.map((entry) => entry.kind)).toEqual(['episode']);
  });

  it.each(['not-a-date', '2026-7-10', '2026-07-10 ', '2026-02-30'])(
    'should drop a movie row whose release date %j is not a calendar date',
    async (released) => {
      serveCalendarRows([EPISODE_ROW, { ...MOVIE_ROW, released }]);

      const result = await readCalendar();

      expect(result?.map((entry) => entry.kind)).toEqual(['episode']);
    },
  );

  it('should drop an episode row with neither air date', async () => {
    serveCalendarRows([
      {
        ...EPISODE_ROW,
        first_aired: null,
        episode: { ...EpisodeSiloResponseMock, first_aired: null },
      },
      MOVIE_ROW,
    ]);

    const result = await readCalendar();

    expect(result?.map((entry) => entry.kind)).toEqual(['movie']);
  });

  it.each(['', 'not a date'])(
    'should drop an episode row whose air date %j does not parse',
    async (firstAired) => {
      serveCalendarRows([
        { ...EPISODE_ROW, first_aired: firstAired },
        MOVIE_ROW,
      ]);

      const result = await readCalendar();

      expect(result?.map((entry) => entry.kind)).toEqual(['movie']);
    },
  );

  it("should air an episode at the row's date over the episode's", async () => {
    serveCalendarRows([{
      ...EPISODE_ROW,
      first_aired: '2023-05-06T03:00:00.000Z',
    }]);

    const [entry] = await readCalendar() ?? [];

    expect(entry?.kind === 'episode' && entry.airsAt)
      .toEqual(new Date('2023-05-06T03:00:00.000Z'));
  });

  it("should air an episode at the episode's date when the row has none", async () => {
    serveCalendarRows([{
      ...EPISODE_ROW,
      first_aired: null,
      episode: {
        ...EpisodeSiloResponseMock,
        first_aired: '2023-05-07T02:00:00.000Z',
      },
    }]);

    const [entry] = await readCalendar() ?? [];

    expect(entry?.kind === 'episode' && entry.airsAt)
      .toEqual(new Date('2023-05-07T02:00:00.000Z'));
  });

  it("should keep a grouped row's episodes nested on one entry", async () => {
    serveCalendarRows([{
      ...EPISODE_ROW,
      episode: {
        ...EpisodeSiloResponseMock,
        episode_type: 'multiple_episodes',
        episodes: [
          EpisodeSiloResponseMock,
          {
            ...EpisodeSiloResponseMock,
            number: 2,
            ids: { ...EpisodeSiloResponseMock.ids, trakt: 5165668 },
          },
        ],
      },
    }]);

    const result = await readCalendar();
    const [entry] = result ?? [];

    expect(result).toHaveLength(1);
    expect(entry?.kind === 'episode' && entry.episode.type)
      .toBe('multiple_episodes');
    expect(entry?.kind === 'episode' && entry.episodes?.map(({ key }) => key))
      .toEqual(['episode-5165667', 'episode-5165668']);
  });

  it("should date a movie by the row's release, not the movie's", async () => {
    serveCalendarRows([{ ...MOVIE_ROW, released: '2025-01-10' }]);

    const [entry] = await readCalendar() ?? [];

    expect(entry?.kind === 'movie' && entry.releasedOn).toBe('2025-01-10');
  });

  it.each([
    InvalidateAction.Watchlisted('show'),
    InvalidateAction.Watchlisted('movie'),
    InvalidateAction.Watchlisted('season'),
    InvalidateAction.Watchlisted('episode'),
    InvalidateAction.MarkAsWatched('episode'),
    InvalidateAction.MarkAsWatched('show'),
    InvalidateAction.MarkAsWatched('movie'),
    InvalidateAction.Drop('show'),
    InvalidateAction.Restore,
  ])('should refetch on %s', async (action) => {
    const invalidate = await observeInvalidation(() =>
      useQuery(MY_SHOWS_AND_MOVIES)
    );

    const requests = await invalidate(action);

    expect(requests).toEqual(['GET /calendars/my/media/2026-07-06/21']);
  });
});
