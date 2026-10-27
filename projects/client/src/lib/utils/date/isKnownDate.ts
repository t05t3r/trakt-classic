import { isMaxDate } from '$lib/utils/date/isMaxDate.ts';
import { isValidDate } from '$lib/utils/date/isValidDate.ts';

export function isKnownDate(date: Date): boolean {
  return !isMaxDate(date) && isValidDate(date);
}
