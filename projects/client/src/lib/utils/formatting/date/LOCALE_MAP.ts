import type { Locale } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';

import type { AvailableLocale } from '$lib/features/i18n/index.ts';

export const LOCALE_MAP: Partial<Record<AvailableLocale, Locale>> = {
  en: enUS,
};
