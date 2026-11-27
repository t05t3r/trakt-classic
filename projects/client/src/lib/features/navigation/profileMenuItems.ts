import * as m from '$lib/features/i18n/messages.ts';
import { SIGNED_IN_ALIAS } from '$lib/utils/url/SIGNED_IN_ALIAS.ts';
import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';
import type { NavItem } from './topNavItems.ts';
import { userNavItems, type UserNavKey } from './userNavItems.ts';

// Its route is also the path family that selects it.
const WATCHLIST = UrlBuilder.lists.watchlist(SIGNED_IN_ALIAS);

export const profileMenuItems: ReadonlyArray<
  NavItem<UserNavKey | 'watchlist'>
> = [
  ...userNavItems,
  {
    key: 'watchlist',
    route: WATCHLIST,
    match: WATCHLIST,
    label: m.list_title_watchlist,
  },
];
