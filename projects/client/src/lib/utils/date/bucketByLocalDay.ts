import { formatLocalDate } from '$lib/utils/date/formatLocalDate.ts';
import { parseLocalDate } from '$lib/utils/date/parseLocalDate.ts';
import { type LocalDay, toLocalDay } from '$lib/utils/date/toLocalDay.ts';
import { sum } from '$lib/utils/number/sum.ts';

export type LocalDayGroup<T> = LocalDay & {
  items: ReadonlyArray<T>;
  minutes?: number;
};

type BucketByLocalDayParams<T> = {
  rows: ReadonlyArray<T>;
  dayOf: (row: T) => Date;
  minutesOf?: (row: T) => number;
};

export function bucketByLocalDay<T>(
  { rows, dayOf, minutesOf }: BucketByLocalDayParams<T>,
): ReadonlyArray<LocalDayGroup<T>> {
  const byKey = Map.groupBy(rows, (row) => formatLocalDate(dayOf(row)));

  return Array.from(byKey, ([key, items]) => {
    const day = toLocalDay(parseLocalDate(key));
    if (!minutesOf) return { ...day, items };

    return { ...day, items, minutes: sum(items.map(minutesOf)) };
  });
}
