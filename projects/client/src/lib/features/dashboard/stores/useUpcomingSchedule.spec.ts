import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
import { CalendarMediaMappedMock } from '$mocks/data/calendars/mapped/CalendarMediaMappedMock.ts';
import { CalendarMediaResponseMock } from '$mocks/data/calendars/response/CalendarMediaResponseMock.ts';
import { CALENDAR_URL } from '$mocks/data/calendars/CALENDAR_URL.ts';
import { MovieHereticMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticMappedMock.ts';
import { MovieHereticResponseMock } from '$mocks/data/summary/movies/heretic/response/MovieHereticResponseMock.ts';
import { server } from '$mocks/server.ts';
import { movieOn } from '$test/beds/calendar/movieOn.ts';
import { setTimeZone } from '$test/beds/date/setTimeZone.ts';
import { kindsOf } from '$test/beds/query/kindsOf.ts';
import { nextOf } from '$test/beds/query/nextOf.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { captureRequests } from '$test/beds/request/captureRequests.ts';
import { notFound } from '$test/beds/request/notFound.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import type { HotReleaseResponse } from '@trakt/api';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useUpcomingSchedule } from './useUpcomingSchedule.ts';

// Yesterday's date, the window's last day and the day after the window.
const RELEASES_AROUND_THE_WINDOW: HotReleaseResponse[] = [
  '2023-05-03',
  '2023-05-23',
  '2023-05-24',
].map((released) => ({ released, movie: MovieHereticResponseMock }));

function serveCalendar(answer: () => Response) {
  server.use(http.get(CALENDAR_URL, answer));
}

function requestedWindow(requests: ReadonlyArray<string>) {
  return requests
    .filter((request) => request.includes('/calendars/'))
    .map((request) => request.split('/').slice(-2).join('/'));
}

function readSchedule() {
  return runQuery({
    factory: useUpcomingSchedule,
    waitFor: (status: SectionStatus<unknown>) => status.kind !== 'loading',
  });
}

describe('store: useUpcomingSchedule', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2023-05-04T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should read the calendar over 21 days from yesterday's date", async () => {
    const requests = await captureRequests(readSchedule);

    expect(requestedWindow(requests)).toEqual(['2023-05-03/21']);
  });

  it("should start from yesterday's local date east of UTC", async () => {
    setTimeZone('Asia/Tokyo');
    vi.setSystemTime(new Date('2023-05-04T20:00:00.000Z'));

    const requests = await captureRequests(readSchedule);

    expect(requestedWindow(requests)).toEqual(['2023-05-04/21']);
  });

  it('should read the dates with entries from today', async () => {
    const status = await readSchedule();

    expect(status).toEqual({
      kind: 'ready',
      data: [
        {
          key: '2023-05-05',
          date: new Date('2023-05-05T00:00:00.000Z'),
          items: [CalendarMediaMappedMock.at(0)],
        },
      ],
    });
  });

  it("should read no date before today or past the window's last day", async () => {
    serveCalendar(() =>
      HttpResponse.json([
        ...CalendarMediaResponseMock,
        ...RELEASES_AROUND_THE_WINDOW,
      ])
    );

    const status = await readSchedule();

    expect(status).toEqual({
      kind: 'ready',
      data: [
        {
          key: '2023-05-05',
          date: new Date('2023-05-05T00:00:00.000Z'),
          items: [CalendarMediaMappedMock.at(0)],
        },
        {
          key: '2023-05-23',
          date: new Date('2023-05-23T00:00:00.000Z'),
          items: [movieOn(MovieHereticMappedMock.id, '2023-05-23')],
        },
      ],
    });
  });

  it('should read empty when no date holds an entry', async () => {
    serveCalendar(() => HttpResponse.json([]));

    const status = await readSchedule();

    expect(status).toEqual({ kind: 'empty' });
  });

  it('should read error when the calendar fails, then ready once a retry lands', async () => {
    serveCalendar(notFound);
    const { status } = await renderStore(() => ({
      status: useUpcomingSchedule(),
    }));
    const kinds = kindsOf(status);
    const failed = await nextOf(status, 'error');

    serveCalendar(() => HttpResponse.json(CalendarMediaResponseMock));
    failed.retry();
    await nextOf(status, 'ready');

    expect(kinds).toEqual(['loading', 'error', 'loading', 'ready']);
  });
});
