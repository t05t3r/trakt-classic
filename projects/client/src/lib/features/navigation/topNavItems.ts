import type { Pathname } from '$app/types';
import * as m from '$lib/features/i18n/messages.ts';
import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';

export type NavKey = 'dashboard' | 'shows' | 'movies' | 'calendar' | 'discover';

export type NavItem<K extends string = NavKey> = {
  key: K;
  route: Pathname;
  match: `/${string}`;
  label: () => string;
};

export const topNavItems: ReadonlyArray<NavItem> = [
  {
    key: 'dashboard',
    route: UrlBuilder.dashboard(),
    match: '/dashboard',
    label: m.text_nav_dashboard,
  },
  {
    key: 'shows',
    route: UrlBuilder.showsTrending(),
    match: '/shows',
    label: m.text_nav_shows,
  },
  {
    key: 'movies',
    route: UrlBuilder.moviesTrending(),
    match: '/movies',
    label: m.text_nav_movies,
  },
  {
    key: 'calendar',
    route: UrlBuilder.calendar(),
    match: '/calendars',
    label: m.text_nav_calendar,
  },
  {
    key: 'discover',
    route: UrlBuilder.discover(),
    match: '/discover',
    label: m.text_nav_discover,
  },
];
