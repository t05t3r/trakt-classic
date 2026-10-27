import { http, HttpResponse } from 'msw';

import { CALENDAR_URL } from '$mocks/data/calendars/CALENDAR_URL.ts';
import { CalendarMediaResponseMock } from '$mocks/data/calendars/response/CalendarMediaResponseMock.ts';

export const calendars = [
  http.get(
    CALENDAR_URL,
    () => HttpResponse.json(CalendarMediaResponseMock),
  ),
];
