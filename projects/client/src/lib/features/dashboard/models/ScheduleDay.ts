import type { CalendarEntry } from '$lib/requests/models/CalendarEntry.ts';
import type { WindowDay } from '$lib/utils/date/bucketByWindowDay.ts';

export type ScheduleDay = WindowDay<CalendarEntry>;
