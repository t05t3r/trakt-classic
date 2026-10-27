import type { AvailableLocale } from '$lib/features/i18n/index.ts';
import { isValidDate } from '$lib/utils/date/isValidDate.ts';
import { format } from 'date-fns/format';
import { LOCALE_MAP } from './LOCALE_MAP.ts';

export type DatePattern =
  | 'd'
  | 'd MMM'
  | 'd MMM yyyy'
  | 'd MMM yyyy HH:mm'
  | 'd MMMM yyyy'
  | 'd MMMM yyyy HH:mm'
  | 'EEEE'
  | 'HH:mm'
  | 'MMMM d';

export function toHumanPatternDate(
  date: Date,
  pattern: DatePattern,
  localeKey: AvailableLocale = 'en',
): string {
  if (!isValidDate(date)) return '';

  const locale = LOCALE_MAP[localeKey] ?? LOCALE_MAP['en'];

  return format(date, pattern, { locale });
}
