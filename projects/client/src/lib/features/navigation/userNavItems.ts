import * as m from '$lib/features/i18n/messages.ts';
import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';
import type { NavItem } from './topNavItems.ts';

type UserNavKey = 'history' | 'progress' | 'ratings' | 'lists';

export const userNavItems: ReadonlyArray<NavItem<UserNavKey>> = [
  {
    key: 'history',
    route: UrlBuilder.history.home(),
    match: '/users/me/history',
    label: m.text_nav_history,
  },
  {
    key: 'progress',
    route: UrlBuilder.progress(),
    match: '/users/me/progress',
    label: m.text_nav_progress,
  },
  {
    key: 'ratings',
    route: UrlBuilder.ratings(),
    match: '/users/me/ratings',
    label: m.text_nav_ratings,
  },
  {
    key: 'lists',
    route: UrlBuilder.lists.home(),
    match: '/users/me/lists',
    label: m.text_nav_lists,
  },
];
