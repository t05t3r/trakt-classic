import { getLanguageAndRegion } from '$lib/features/i18n/index.ts';

export function languageTag() {
  return getLanguageAndRegion().language;
}
