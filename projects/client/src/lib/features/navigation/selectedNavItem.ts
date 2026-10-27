import type { NavItem } from './topNavItems.ts';

type SelectedNavItemParams<K extends string> = {
  pathname: string;
  hasError: boolean;
  items: ReadonlyArray<NavItem<K>>;
};

const isInFamily = (pathname: string, match: string) =>
  pathname === match || pathname.startsWith(`${match}/`);

// An error render keeps the requested URL, so a 404 under a family must not
// select that family's link.
export function selectedNavItem<K extends string>(
  { pathname, hasError, items }: SelectedNavItemParams<K>,
): K | undefined {
  if (hasError) return undefined;

  return items.find((item) => isInFamily(pathname, item.match))?.key;
}
