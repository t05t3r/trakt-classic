import { dedupe } from '$lib/utils/array/dedupe.ts';
import { addDays } from '$lib/utils/date/addDays.ts';
import { formatLocalDate } from '$lib/utils/date/formatLocalDate.ts';
import { getStartOfDay } from '$lib/utils/date/getStartOfDay.ts';

export type LocalDay = {
  key: string;
  date: Date;
};

export type WindowDay<T> = LocalDay & {
  items: ReadonlyArray<T>;
};

type BucketByWindowDayParams<T> = {
  items: ReadonlyArray<T>;
  dayOf: (item: T) => Date;
  start: Date;
  days: number;
};

function toLocalDay(date: Date): LocalDay {
  return { key: formatLocalDate(date), date };
}

export function bucketByWindowDay<T>(
  { items, dayOf, start, days }: BucketByWindowDayParams<T>,
): ReadonlyArray<WindowDay<T>> {
  const byKey = Map.groupBy(items, (item) => formatLocalDate(dayOf(item)));
  const localDays = Array.from(
    { length: days },
    (_, offset) => toLocalDay(getStartOfDay(addDays(start, offset))),
  );

  // A zone that skips a calendar day maps two offsets onto the next one.
  return dedupe(({ key }) => key, localDays).map((day) => ({
    ...day,
    items: byKey.get(day.key) ?? [],
  }));
}
