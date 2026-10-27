import { WELL_KNOWN_MEDIA_QUERY } from '$lib/stores/css/WELL_KNOWN_MEDIA_QUERY.ts';
import { fakeLayouts } from '$test/beds/css/fakeLayouts.ts';
import { glyphClasses } from '$test/beds/menus/glyphClasses.ts';
import { openMenuFromKeyboard } from '$test/beds/menus/openMenuFromKeyboard.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { render, screen, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import WatchedFilterMenu from './WatchedFilterMenu.svelte';

const setLayout = fakeLayouts({
  desktop: WELL_KNOWN_MEDIA_QUERY.desktop,
  tabletSmallAndBelow: WELL_KNOWN_MEDIA_QUERY.tabletSmallAndBelow,
});

const trigger = () => screen.getByRole('button', { name: 'Filters' });
const row = (name: string) => screen.getByRole('menuitemradio', { name });
const openMenu = async () => {
  await userEvent.click(trigger());
  return screen.findByRole('menu', { name: 'Filters' });
};

beforeEach(() => {
  stubClientRects();
  setLayout('desktop');
});

describe('component: WatchedFilterMenu', () => {
  it('should show an eye and a caret on a trigger named Filters', () => {
    render(WatchedFilterMenu, {
      props: { value: null, onValueChange: vi.fn() },
    });

    expect(glyphClasses(trigger())).toEqual([
      expect.stringContaining('tabler-icon-eye'),
      expect.stringContaining('tabler-icon-chevron-down'),
    ]);
  });

  it('should read as off while no filter is set', () => {
    const { container } = render(WatchedFilterMenu, {
      props: { value: null, onValueChange: vi.fn() },
    });

    expect(trigger()).not.toHaveClass('is-selected');
    const eye = container.querySelector('.trakt-watched-filter-menu');
    expect(eye).not.toHaveClass('is-struck');
  });

  it.each(['fade', 'hide'] as const)(
    'should read as selected and strike the eye while %s is set',
    (value) => {
      const { container } = render(WatchedFilterMenu, {
        props: { value, onValueChange: vi.fn() },
      });

      expect(trigger()).toHaveClass('is-selected');
      const eye = container.querySelector('.trakt-watched-filter-menu');
      expect(eye).toHaveClass('is-struck');
    },
  );

  it('should offer Fade watched and Hide watched, checking the set one', async () => {
    render(WatchedFilterMenu, {
      props: { value: 'hide', onValueChange: vi.fn() },
    });
    await openMenu();

    expect(
      screen.getAllByRole('menuitemradio').map((item) =>
        item.textContent?.trim()
      ),
    )
      .toEqual(['Fade watched', 'Hide watched']);
    expect(row('Hide watched')).toHaveAttribute('aria-checked', 'true');
    expect(row('Fade watched')).toHaveAttribute('aria-checked', 'false');
  });

  it('should report the filter it selects', async () => {
    const onValueChange = vi.fn();
    render(WatchedFilterMenu, { props: { value: 'fade', onValueChange } });
    await openMenu();

    await userEvent.click(row('Hide watched'));

    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('hide');
  });

  it('should report no filter when the set one is selected again', async () => {
    const onValueChange = vi.fn();
    render(WatchedFilterMenu, { props: { value: 'fade', onValueChange } });

    await openMenuFromKeyboard(trigger(), 'Fade watched');
    await userEvent.keyboard('{Enter}');

    expect(onValueChange).toHaveBeenCalledExactlyOnceWith(null);
    await waitFor(() => expect(trigger()).toHaveFocus());
  });

  it.each([
    { layout: 'desktop' as const, align: 'start' },
    { layout: 'tabletSmallAndBelow' as const, align: 'end' },
  ])(
    'should align its menu to the $align at $layout',
    async ({ layout, align }) => {
      setLayout(layout);
      render(WatchedFilterMenu, {
        props: { value: null, onValueChange: vi.fn() },
      });

      const menu = await openMenu();

      expect(menu).toHaveAttribute('data-align', align);
    },
  );
});
