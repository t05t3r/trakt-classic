import * as m from '$lib/features/i18n/messages.ts';
import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';
import type { NavItem } from './topNavItems.ts';
import { userNavItems, type UserNavKey } from './userNavItems.ts';

export const profileMenuItems: ReadonlyArray<
  NavItem<UserNavKey | 'watchlist'>
> = [
  ...userNavItems,
  {
    key: 'watchlist',
    route: UrlBuilder.lists.watchlist('me'),
    match: '/users/me/watchlist',
    label: m.list_title_watchlist,
  },
];
