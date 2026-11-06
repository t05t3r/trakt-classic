import type { DateRangeDays } from '$lib/models/DateRangeDays.ts';
import type { DateRangeParams } from '$lib/requests/models/DateRangeParams.ts';
import { formatLocalDate } from '$lib/utils/date/formatLocalDate.ts';
import { subMilliseconds } from 'date-fns/subMilliseconds';

export function toDateRangeDays(
  { startDate, endDate }: DateRangeParams,
): DateRangeDays {
  return {
    start: startDate ? formatLocalDate(startDate) : '',
    // An end is a day's last instant or the next day's first; 1 ms back lands on the day either way.
    end: endDate ? formatLocalDate(subMilliseconds(endDate, 1)) : '',
  };
}
