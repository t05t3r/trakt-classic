import { isKnownDate } from '$lib/utils/date/isKnownDate.ts';
import { toHumanPatternDate } from '$lib/utils/formatting/date/toHumanPatternDate.ts';
import type { StatsValue } from '$lib/sections/summary/StatsRow.ts';

export function toDayValues(
  key: string,
  date: Date,
): ReadonlyArray<StatsValue> {
  if (!isKnownDate(date)) return [];

  const text = toHumanPatternDate(date, 'd MMMM yyyy');
  return text ? [{ key, text }] : [];
}
