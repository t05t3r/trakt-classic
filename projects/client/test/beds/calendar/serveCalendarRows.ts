import { CALENDAR_URL } from '$mocks/data/calendars/CALENDAR_URL.ts';
import { server } from '$mocks/server.ts';
import type { HotReleaseResponse } from '@trakt/api';
import { http, HttpResponse } from 'msw';

export function serveCalendarRows(
  rows: ReadonlyArray<HotReleaseResponse>,
): void {
  server.use(http.get(CALENDAR_URL, () => HttpResponse.json(rows)));
}
