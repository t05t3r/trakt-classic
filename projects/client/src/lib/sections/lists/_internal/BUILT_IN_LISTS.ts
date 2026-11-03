import type { Pathname } from '$app/types';
import * as m from '$lib/features/i18n/messages.ts';
import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';

type BuiltInList = Readonly<{
  title: () => string;
  description: () => string;
  emptyText: () => string;
  href: (slug: string) => Pathname;
  // Whether each card carries its rank badge.
  hasRank: boolean;
  // Whether each card carries the favourite quick-icon.
  hasFavorite: boolean;
}>;

export const BUILT_IN_LISTS = {
  watchlist: {
    title: m.list_title_watchlist,
    description: m.text_lists_description_watchlist,
    emptyText: m.text_lists_empty_watchlist,
    href: UrlBuilder.lists.watchlist,
    hasRank: false,
    hasFavorite: false,
  },
  favorites: {
    title: m.list_title_favorites,
    description: m.text_lists_description_favorites,
    emptyText: m.text_lists_empty_favorites,
    href: UrlBuilder.lists.favorites,
    hasRank: true,
    hasFavorite: true,
  },
} as const satisfies Record<string, BuiltInList>;
