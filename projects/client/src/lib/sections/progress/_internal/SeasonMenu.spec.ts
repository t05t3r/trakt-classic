import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { glyphClasses } from '$test/beds/menus/glyphClasses.ts';
import { openMenuByClick } from '$test/beds/menus/openMenuByClick.ts';
import { readMenuRows } from '$test/beds/menus/readMenuRows.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { screen, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SeasonMenu from './SeasonMenu.svelte';
import type { SeasonMenuProps } from './SeasonMenuProps.ts';

const SEASON_THREE = { number: 3, id: 33 };
const LATER = [{ number: 4, id: 44 }, { number: 5, id: 55 }];

function renderMenu(props: Partial<SeasonMenuProps> = {}) {
  const onhide = vi.fn();
  const onunhide = vi.fn();
  renderComponent(SeasonMenu, {
    props: {
      number: 3,
      isHidden: false,
      hides: { season: SEASON_THREE, later: LATER },
      isUpdating: false,
      onhide,
      onunhide,
      ...props,
    },
  });

  return { onhide, onunhide };
}

const openMenu = () => openMenuByClick('Season 3 actions', 'Season 3 actions');

describe('component: SeasonMenu', () => {
  beforeEach(() => {
    stubClientRects();
  });

  it('should name its dots button after the season, with that name as its tooltip', async () => {
    renderMenu();
    const trigger = screen.getByRole('button', { name: 'Season 3 actions' });

    await userEvent.hover(trigger);

    await waitFor(() =>
      expect(trigger).toHaveAccessibleDescription('Season 3 actions')
    );
    expect(glyphClasses(trigger)).toEqual([
      expect.stringContaining('tabler-icon-dots'),
    ]);
  });

  it('should offer to hide the season, it and later, or every season after it', async () => {
    renderMenu();

    const menu = await openMenu();

    expect(readMenuRows()).toEqual([
      'Hide Season 3',
      'Hide Season 3 and later',
      'Hide every season after Season 3',
    ]);
    expect(glyphClasses(menu)).toEqual(
      Array(3).fill(expect.stringContaining('tabler-icon-ban')),
    );
  });

  it.each([
    ['Hide Season 3', [SEASON_THREE]],
    ['Hide Season 3 and later', [SEASON_THREE, ...LATER]],
    ['Hide every season after Season 3', LATER],
  ])('should hide what %s names', async (item, seasons) => {
    const { onhide, onunhide } = renderMenu();
    await openMenu();

    await userEvent.click(screen.getByRole('menuitem', { name: item }));

    expect(onhide).toHaveBeenCalledExactlyOnceWith({
      seasons,
      trigger: screen.getByRole('button', { name: 'Season 3 actions' }),
    });
    expect(onunhide).not.toHaveBeenCalled();
  });

  it('should offer only to hide the season when no later season is shown', async () => {
    renderMenu({ hides: { season: SEASON_THREE, later: [] } });

    await openMenu();

    expect(readMenuRows()).toEqual(['Hide Season 3']);
  });

  it('should offer only to unhide a hidden season', async () => {
    const { onhide, onunhide } = renderMenu({ isHidden: true });

    const menu = await openMenu();
    expect(readMenuRows()).toEqual(['Unhide Season 3']);
    expect(glyphClasses(menu)).toEqual([
      expect.stringContaining('tabler-icon-eye'),
    ]);

    await userEvent.click(
      screen.getByRole('menuitem', { name: 'Unhide Season 3' }),
    );

    expect(onunhide).toHaveBeenCalledExactlyOnceWith([SEASON_THREE]);
    expect(onhide).not.toHaveBeenCalled();
  });

  it.each([
    ['while a hide is saving', { isUpdating: true }],
    ["until the season's ids load", { hides: undefined }],
  ])('should stay inert %s', async (_, props) => {
    renderMenu(props);
    const trigger = screen.getByRole('button', { name: 'Season 3 actions' });

    expect(trigger).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(trigger);
    await waitNegativeClaim();

    expect(screen.queryByRole('menu')).toBeNull();
  });

  it.each([
    ['while a hide is saving', { isUpdating: true }, true],
    ["until the season's ids load", { hides: undefined }, true],
    ['once it takes presses', {}, false],
  ])(
    'should mark its trigger dimmed only while inert, %s',
    (_, props, isDimmed) => {
      renderMenu(props);

      expect(
        screen.getByRole('button', { name: 'Season 3 actions' }).classList
          .contains('is-inert'),
      ).toBe(isDimmed);
    },
  );
});
