import { USER_NAV_LINKS } from '$mocks/data/navigation/USER_NAV_LINKS.ts';
import { describe, expect, it } from 'vitest';
import { selectedNavItem } from './selectedNavItem.ts';
import { userNavItems } from './userNavItems.ts';

describe('userNavItems', () => {
  it("should list the signed-in user's pages in menu order", () => {
    expect(userNavItems.map((item) => [item.label(), item.route])).toEqual(
      USER_NAV_LINKS,
    );
  });

  it.each([
    ['/users/me/history/shows', 'history'],
    ['/users/me/progress', 'progress'],
    ['/users/me/ratings/movies', 'ratings'],
    ['/users/me/lists/watched', 'lists'],
  ])('should select the item of %s', (pathname, key) => {
    expect(
      selectedNavItem({ pathname, hasError: false, items: userNavItems }),
    ).toBe(key);
  });

  it('should select no item outside the signed-in user pages', () => {
    expect(
      selectedNavItem({
        pathname: '/users/me/library',
        hasError: false,
        items: userNavItems,
      }),
    ).toBeUndefined();
  });
});
