import { SIGNED_IN_ALIAS } from '$lib/utils/url/SIGNED_IN_ALIAS.ts';
import { USER_SEGMENT } from '$lib/utils/url/USER_SEGMENT.ts';
import type { NavItem } from './topNavItems.ts';

type SelectedNavItemParams<K extends string> = {
  pathname: string;
  hasError: boolean;
  items: ReadonlyArray<NavItem<K>>;
};

// The `me` alias redirects to the signed-in user's slug, and any other user's
// page is a 404, so every user segment reads as `me`.
const asSignedInUser = (pathname: string) =>
  pathname.replace(USER_SEGMENT, `/users/${SIGNED_IN_ALIAS}`);

const isInFamily = (pathname: string, match: string) =>
  pathname === match || pathname.startsWith(`${match}/`);

// An error render keeps the requested URL, so a 404 under a family must not
// select that family's link.
export function selectedNavItem<K extends string>(
  { pathname, hasError, items }: SelectedNavItemParams<K>,
): K | undefined {
  if (hasError) return undefined;

  const path = asSignedInUser(pathname);

  return items.find((item) => isInFamily(path, item.match))?.key;
}
