import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
import { toSectionStatus } from '$lib/features/query/toSectionStatus.ts';
import { useQuery } from '$lib/features/query/useQuery.ts';
import type { ScheduleDay } from '$lib/features/dashboard/models/ScheduleDay.ts';
import { calendarQuery } from '$lib/requests/queries/calendars/calendarQuery.ts';
import { isEmpty } from '$lib/utils/array/isEmpty.ts';
import { formatLocalDate } from '$lib/utils/date/formatLocalDate.ts';
import { subtractDays } from '$lib/utils/date/subtractDays.ts';
import { map, type Observable } from 'rxjs';
import { toScheduleDays } from '../_internal/toScheduleDays.ts';

const WINDOW_DAYS = 21;

// The clock is read once, so the window and its days hold still until the page remounts.
export function useUpcomingSchedule(): Observable<
  SectionStatus<ReadonlyArray<ScheduleDay>>
> {
  const today = new Date();
  // East of UTC, today's early entries fall on yesterday's UTC date.
  const start = subtractDays(today, 1);
  const query = calendarQuery({
    target: 'my',
    tab: 'shows-movies',
    startDate: formatLocalDate(start),
    days: WINDOW_DAYS,
  });

  return useQuery(query).pipe(
    map((result) =>
      toSectionStatus({
        result,
        select: (entries) =>
          toScheduleDays({ entries, today, start, days: WINDOW_DAYS }),
        isEmpty,
      })
    ),
  );
}
