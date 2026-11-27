import { isKnownDate } from '$lib/utils/date/isKnownDate.ts';

export function toKnownDate(date: Date | Nil): Date | undefined {
  if (!date || !isKnownDate(date)) return undefined;

  return date;
}
