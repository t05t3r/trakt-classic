import * as m from '$lib/features/i18n/messages.ts';
import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';
import type { NavItem } from './topNavItems.ts';

export type UserNavKey = 'history' | 'progress' | 'ratings' | 'lists';

// Each page's route is also the path family that selects it.
const HISTORY = UrlBuilder.history.home();
const PROGRESS = UrlBuilder.progress();
const RATINGS = UrlBuilder.ratings();
const LISTS = UrlBuilder.lists.home();

export const userNavItems: ReadonlyArray<NavItem<UserNavKey>> = [
  {
    key: 'history',
    route: HISTORY,
    match: HISTORY,
    label: m.text_nav_history,
  },
  {
    key: 'progress',
    route: PROGRESS,
    match: PROGRESS,
    label: m.text_nav_progress,
  },
  {
    key: 'ratings',
    route: RATINGS,
    match: RATINGS,
    label: m.text_nav_ratings,
  },
  {
    key: 'lists',
    route: LISTS,
    match: LISTS,
    label: m.text_nav_lists,
  },
];
