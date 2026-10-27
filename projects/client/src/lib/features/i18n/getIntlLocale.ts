import type {
  AvailableLanguage,
  AvailableLocale,
} from '$lib/features/i18n/index.ts';
import { languageTag } from '$lib/features/i18n/languageTag.ts';

/**
 * Returns a locale string suitable for `Intl.*` constructors.
 *
 * For Arabic (`ar-SA`), forces Gregorian calendar (`ca-gregory`) and Latin
 * numerals (`nu-latn`).  The Trakt UI displays years, durations, and ratings
 * as Latin digits everywhere; without the `nu-latn` override, `Intl`
 * formatters would emit Eastern Arabic-Indic numerals (٠١٢…) which would
 * clash with the rest of the interface.  All other locales pass through
 * unchanged.
 */
export function getIntlLocale(
  locale: AvailableLocale | AvailableLanguage = languageTag(),
) {
  if (locale === 'ar-SA' || locale === 'ar' || locale.startsWith('ar-')) {
    return 'ar-SA-u-ca-gregory-nu-latn';
  }
  return locale;
}
