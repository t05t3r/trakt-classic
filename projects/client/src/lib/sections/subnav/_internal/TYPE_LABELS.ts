import * as m from '$lib/features/i18n/messages.ts';
import type { ListTypeSegment } from '$lib/features/lists/toListTypeSegment.ts';

// Keyed by the plural path segment, so every type menu reads one set, its All row included.
export const TYPE_LABELS: Record<ListTypeSegment<'watchlist'>, () => string> = {
  all: m.button_text_type_all,
  movies: m.button_text_movies,
  shows: m.button_text_shows,
  seasons: m.button_text_type_seasons,
  episodes: m.button_text_type_episodes,
};
