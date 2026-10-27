import type { AvailableLanguage } from '$lib/features/i18n/index.ts';
import { getIntlLocale } from '$lib/features/i18n/getIntlLocale.ts';
import { nonNegativeFinite } from '$lib/utils/number/nonNegativeFinite.ts';
import { createUnitFormatter } from './_internal/createUnitFormatter.ts';

export function toHumanMinuteTotal(
  minutes: number,
  locale: AvailableLanguage = 'en',
): string {
  return createUnitFormatter({
    locale: getIntlLocale(locale),
    unit: 'minute',
    unitDisplay: 'narrow',
  }).format(nonNegativeFinite(minutes));
}
