import type { AvailableLanguage } from '$lib/features/i18n/index.ts';
import { nonNegativeFinite } from '$lib/utils/number/nonNegativeFinite.ts';
import { toHumanDuration } from './toHumanDuration.ts';
import { toHumanMinuteTotal } from './toHumanMinuteTotal.ts';

// toHumanDuration drops every zero unit, so a zero total reads as 0m.
export function toHumanMinutes(
  minutes: number,
  locale: AvailableLanguage = 'en',
): string {
  return toHumanDuration({ minutes: nonNegativeFinite(minutes) }, locale) ||
    toHumanMinuteTotal(0, locale);
}
