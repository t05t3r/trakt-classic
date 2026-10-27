import { page } from '$app/state';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import NavbarLinks from './NavbarLinks.svelte';

const renderAt = (pathname: string, error: App.Error | null = null) => {
  window.history.replaceState(null, '', pathname);
  page.error = error;
  return render(NavbarLinks);
};

const currentLinks = () => screen.queryAllByRole('link', { current: 'page' });

describe('component: NavbarLinks', () => {
  it('should link the five top links to their routes', () => {
    renderAt('/dashboard');

    expect(
      screen.getAllByRole('link').map((link) => [
        link.textContent?.trim(),
        link.getAttribute('href'),
      ]),
    ).toEqual([
      ['Dashboard', '/dashboard'],
      ['Shows', '/shows/trending'],
      ['Movies', '/movies/trending'],
      ['Calendar', '/calendars'],
      ['Discover', '/discover'],
    ]);
  });

  it('should mark the link of the current family as the current page', () => {
    renderAt('/shows/silo/seasons/1');

    expect(currentLinks().map((link) => link.textContent?.trim()))
      .toEqual(['Shows']);
  });

  it('should mark no link on a path that only shares a prefix', () => {
    renderAt('/showsx');

    expect(currentLinks()).toHaveLength(0);
  });

  it('should mark no link on an error page under a family path', () => {
    renderAt('/shows/unknown-slug', { message: 'Not Found' });

    expect(currentLinks()).toHaveLength(0);
  });
});
