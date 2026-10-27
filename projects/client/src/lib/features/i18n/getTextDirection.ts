import type { AvailableLocale } from '$lib/features/i18n/index.ts';

const RTL_LOCALES = new Set<AvailableLocale>(['fa-IR', 'ar-SA']);

export const getTextDirection = (locale: AvailableLocale) =>
  RTL_LOCALES.has(locale) ? 'rtl' : 'ltr';
