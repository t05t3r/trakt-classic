import { Theme } from '$lib/features/theme/models/Theme.ts';
import type { Handle } from '@sveltejs/kit';

const THEME_PLACEHOLDER = '%theme.current%';

export const handle: Handle = ({ event, resolve }) => {
  event.locals.theme = Theme.Dark;

  return resolve(event, {
    transformPageChunk({ html, done }) {
      if (!done) return html;
      return html.replace(THEME_PLACEHOLDER, event.locals.theme);
    },
  });
};
