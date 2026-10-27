import type { AvailableLocale } from '$lib/features/i18n/index.ts';
import { locales } from '$lib/paraglide/runtime.js';

export const availableLocales: ReadonlyArray<AvailableLocale> = locales;
