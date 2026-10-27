import { describe, expect, it } from 'vitest';
import { selectedNavItem } from './selectedNavItem.ts';
import { type NavItem, topNavItems } from './topNavItems.ts';

const selectedAt = (pathname: string, hasError = false) =>
  selectedNavItem({ pathname, hasError, items: topNavItems });

describe('selectedNavItem', () => {
  describe('on a page', () => {
    it.each([
      ['/dashboard', 'dashboard'],
      ['/shows', 'shows'],
      ['/shows/trending', 'shows'],
      ['/shows/silo/seasons/1/episodes/3', 'shows'],
      ['/movies/trending', 'movies'],
      ['/movies/top-gun-maverick-2022', 'movies'],
      ['/calendars', 'calendar'],
      ['/calendars/my/shows', 'calendar'],
      ['/discover', 'discover'],
    ])('should select the link of %s', (pathname, key) => {
      expect(selectedAt(pathname)).toBe(key);
    });

    it.each([
      '/showsx',
      '/dashboards',
      '/users/me/history',
      '/lists/official/marvel',
      '/search',
      '/',
    ])('should select nothing on %s', (pathname) => {
      expect(selectedAt(pathname)).toBeUndefined();
    });
  });

  describe('on an error page', () => {
    it('should select nothing under a family path', () => {
      expect(selectedAt('/shows/unknown-slug', true)).toBeUndefined();
    });

    it('should select nothing at a link route', () => {
      expect(selectedAt('/dashboard', true)).toBeUndefined();
    });
  });

  it('should select the first item whose family matches', () => {
    const items: ReadonlyArray<NavItem> = [
      {
        key: 'dashboard',
        route: '/dashboard',
        match: '/shows',
        label: () => '',
      },
      {
        key: 'shows',
        route: '/shows/trending',
        match: '/shows',
        label: () => '',
      },
    ];

    expect(selectedNavItem({ pathname: '/shows', hasError: false, items }))
      .toBe('dashboard');
  });

  it('should select the key of items outside the top links', () => {
    const items: ReadonlyArray<NavItem<'history' | 'lists'>> = [
      {
        key: 'history',
        route: '/users/me/history',
        match: '/users/me/history',
        label: () => '',
      },
      {
        key: 'lists',
        route: '/users/me/lists',
        match: '/users/me/lists',
        label: () => '',
      },
    ];

    const selected: 'history' | 'lists' | undefined = selectedNavItem({
      pathname: '/users/me/lists/watched',
      hasError: false,
      items,
    });

    expect(selected).toBe('lists');
  });
});
