import type { DateRangeParams } from '$lib/requests/models/DateRangeParams.ts';
import { addDays } from '$lib/utils/date/addDays.ts';
import { getEndOfDay } from '$lib/utils/date/getEndOfDay.ts';
import { getStartOfDay } from '$lib/utils/date/getStartOfDay.ts';
import { parseDateOnly } from '$lib/utils/date/parseDateOnly.ts';

type DateRangeSearch = Readonly<
  Record<'start_at' | 'end_at' | 'days', string | null>
>;

// A raw + in a Classic link reads as a space in the search params, a %2B as a +.
const DATE_PART =
  /^(\d{4}-\d{2}-\d{2})(?:T\d{2}:\d{2}:\d{2}(?:Z|[ +-]\d{2}:\d{2})?)?$/;

const DAY_COUNT = /^[1-9]\d{0,4}$/;

const toLocalDay = (value: string | null) =>
  parseDateOnly(value?.match(DATE_PART)?.at(1));

export function toDateRangeQuery(
  { start_at: startAt, end_at: endAt, days }: DateRangeSearch,
): DateRangeParams {
  const startDate = toLocalDay(startAt);
  const end = toLocalDay(endAt);

  if (!startDate) return end ? { endDate: getEndOfDay(end) } : {};
  if (end) {
    return startDate > end ? {} : { startDate, endDate: getEndOfDay(end) };
  }
  if (!days || !DAY_COUNT.test(days)) return { startDate };

  // A start on a day with no midnight parses to 01:00, which addDays would keep.
  return {
    startDate,
    endDate: getStartOfDay(addDays(startDate, Number(days))),
  };
}
