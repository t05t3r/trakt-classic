import type { Locale } from '$lib/paraglide/runtime.js';
import {
  baseLocale,
  getLocale as _getLocale,
  setLocale as _setLocale,
} from '$lib/paraglide/runtime.js';
import { availableLocales } from '$lib/features/i18n/availableLocales.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { resolveAcceptLanguage } from 'resolve-accept-language';

const DEFAULT_REGION_EN = 'us';
const FALLBACK_LOCALE = `en-${DEFAULT_REGION_EN}`;

type ExtractLanguage<T> = T extends `${infer Lang}-${string}` ? Lang : T;
type ExtractRegion<T> = T extends 'en' ? 'us'
  : T extends `${string}-${infer Region}` ? Region
  : T;

// Wider than the one shipped locale because the formatters' tables are keyed by
// it; setLocale and getPreferredLocale sanitise every input to `en`.
export type AvailableLocale =
  | 'en'
  | 'en-AU'
  | 'fr-FR'
  | 'fr-CA'
  | 'ja-JP'
  | 'pt-BR'
  | 'es-ES'
  | 'es-MX'
  | 'ro-RO'
  | 'de-DE'
  | 'nl-NL'
  | 'uk-UA'
  | 'ru-RU'
  | 'pl-PL'
  | 'it-IT'
  | 'bg-BG'
  | 'sv-SE'
  | 'nb-NO'
  | 'da-DK'
  | 'zh-CN'
  | 'tr-TR'
  | 'hu-HU'
  | 'el-GR'
  | 'fa-IR'
  | 'pt-PT'
  | 'ca-ES'
  | 'id-ID'
  | 'ar-SA';
export type AvailableLanguage = ExtractLanguage<AvailableLocale>;
type AvailableRegion = ExtractRegion<AvailableLocale>;

const defaultLocale = baseLocale;

function sanitizeLocale(locale: string): AvailableLocale {
  return availableLocales.includes(locale as AvailableLocale)
    ? locale as AvailableLocale
    : defaultLocale;
}

function splitLanguageTag(languageTag: AvailableLocale): {
  language: AvailableLanguage;
  region: AvailableRegion;
} {
  const parts = languageTag.split('-');

  const language = assertDefined(
    parts.at(0),
    'Language code is required.',
  ) as AvailableLanguage;
  const region = assertDefined(
    language === 'en' ? DEFAULT_REGION_EN : parts.at(1),
    'Region code is required.',
  ) as AvailableRegion;

  return {
    language,
    region,
  };
}

export function getLanguageAndRegion() {
  return splitLanguageTag(getLocale());
}

function getLocale() {
  return _getLocale();
}

export const setLocale = (locale: string): AvailableLocale => {
  const sanitizedLocale = sanitizeLocale(locale);

  // Paraglide's own locale union is narrower than the account locale, so the
  // cast is the deliberate seam between the two.
  _setLocale(sanitizedLocale as Locale, { reload: false });
  return sanitizedLocale;
};

export const getPreferredLocale = (headers: Headers): AvailableLocale => {
  const localeIdentifiers = availableLocales.map((locale) => {
    const { language, region } = splitLanguageTag(locale);
    return `${language}-${region}`;
  });

  const resolvedLocale = resolveAcceptLanguage(
    headers.get('Accept-Language') ?? '',
    localeIdentifiers,
    FALLBACK_LOCALE,
  );

  return sanitizeLocale(resolvedLocale);
};
