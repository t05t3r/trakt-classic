import { getPreferredLocale, setLocale } from '$lib/features/i18n/index.ts';
import { getTextDirection } from '$lib/features/i18n/getTextDirection.ts';
import {
  type Locale,
  overwriteServerAsyncLocalStorage,
} from '$lib/paraglide/runtime.js';
import { AsyncLocalStorage } from 'node:async_hooks';
import type { Handle } from '@sveltejs/kit';

const LANG_PLACEHOLDER = '%paraglide.lang%';
const DIRECTION_PLACEHOLDER = '%paraglide.textDirection%';

const localeStorage = new AsyncLocalStorage<{
  locale?: Locale;
  origin?: string;
  messageCalls?: Set<string>;
}>();
overwriteServerAsyncLocalStorage(localeStorage);

export const handle: Handle = ({ event, resolve }) => {
  const locale = setLocale(getPreferredLocale(event.request.headers));
  const direction = getTextDirection(locale);

  return localeStorage.run({ locale: locale as Locale }, () =>
    resolve(event, {
      transformPageChunk({ html, done }) {
        if (!done) return html;
        return html
          .replace(LANG_PLACEHOLDER, locale)
          .replace(DIRECTION_PLACEHOLDER, direction);
      },
    }));
};
