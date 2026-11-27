import { page } from '$app/state';
import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { glyphClasses } from '$test/beds/menus/glyphClasses.ts';
import { isMenuRowChecked } from '$test/beds/subnav/isMenuRowChecked.ts';
import MobileMenu from './MobileMenu.svelte';

const renderAt = (pathname: string) => {
  window.history.replaceState(null, '', pathname);
  page.error = null;
  return render(MobileMenu);
};

const openMenu = async () => {
  await fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
  return screen.getByRole('menu', { name: 'Menu' });
};

describe('component: MobileMenu', () => {
  it('should name the hamburger button', () => {
    renderAt('/dashboard');

    expect(screen.getByRole('button', { name: 'Menu' })).toHaveAttribute(
      'aria-haspopup',
      'menu',
    );
  });

  it('should link each row to its top link route', async () => {
    renderAt('/dashboard');

    const menu = await openMenu();

    expect(
      within(menu).getAllByRole('menuitem').map((row) => [
        row.textContent?.trim(),
        row.getAttribute('href'),
      ]),
    ).toEqual([
      ['Dashboard', '/dashboard'],
      ['Shows', '/shows/trending'],
      ['Movies', '/movies/trending'],
      ['Calendar', '/calendars'],
      ['Discover', '/discover'],
    ]);
  });

  it("should mark the current route's row as the current page", async () => {
    renderAt('/movies/trending');

    const menu = await openMenu();

    expect(
      within(menu)
        .getAllByRole('menuitem', { current: 'page' })
        .map((row) => row.textContent?.trim()),
    ).toEqual(['Movies']);
  });

  it("should draw the current page's row in the accent, with no check", async () => {
    renderAt('/movies/trending');

    const menu = await openMenu();

    const current = within(menu).getByRole('menuitem', { current: 'page' });
    expect(isMenuRowChecked(current)).toBe(true);
    expect(glyphClasses(current)).toEqual([]);
  });
});
