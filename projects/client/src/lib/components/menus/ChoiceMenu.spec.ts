import { openMenuByClick } from '$test/beds/menus/openMenuByClick.ts';
import { pickMenuRadio } from '$test/beds/menus/pickMenuRadio.ts';
import { readCheckedMenuRow } from '$test/beds/menus/readCheckedMenuRow.ts';
import { readMenuRows } from '$test/beds/menus/readMenuRows.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { isTriggerChanged } from '$test/beds/subnav/isTriggerChanged.ts';
import { render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ChoiceMenu from './ChoiceMenu.svelte';
import type { ChoiceMenuProps } from './_internal/ChoiceMenuProps.ts';

type Kind = 'movie' | 'show';

type ChoiceProps = ChoiceMenuProps<Kind>;

const PROPS: Omit<Extract<ChoiceProps, { all?: undefined }>, 'changed'> = {
  label: 'Type',
  triggerLabel: (shown) => `Type: ${shown}`,
  value: 'show',
  choices: [
    { value: 'movie', label: 'Movies' },
    { value: 'show', label: 'Shows' },
  ],
  onChange: () => {},
};

// Taken per shape, so an override keeps `value` paired with its `all`.
type ChoiceOverrides<P = ChoiceProps> = P extends ChoiceProps
  ? Partial<Omit<P, 'onChange' | 'all'>> & Pick<P, 'all'>
  : never;

function renderMenu(props: ChoiceOverrides = {}) {
  const onChange = vi.fn();
  render(ChoiceMenu<Kind>, { props: { ...PROPS, onChange, ...props } });
  return { onChange };
}

const openMenu = (name: string) => openMenuByClick(name, 'Type');

beforeEach(() => {
  stubClientRects();
});

describe('component: ChoiceMenu', () => {
  it('should show the current choice, named through its trigger label', () => {
    renderMenu();

    expect(screen.getByRole('button', { name: 'Type: Shows' }))
      .toHaveTextContent(/^Shows$/);
  });

  it('should list the choices in their order with the current one checked', async () => {
    renderMenu();

    await openMenu('Type: Shows');

    expect(readMenuRows('menuitemradio')).toEqual(['Movies', 'Shows']);
    expect(readCheckedMenuRow()).toBe('Shows');
  });

  it('should report a choice picked from another row', async () => {
    const { onChange } = renderMenu();
    await openMenu('Type: Shows');

    await pickMenuRadio('Movies');

    expect(onChange).toHaveBeenCalledExactlyOnceWith('movie');
  });

  it('should report nothing when the current choice is picked again', async () => {
    const { onChange } = renderMenu();
    await openMenu('Type: Shows');

    await pickMenuRadio('Shows');
    await waitNegativeClaim();

    expect(onChange).not.toHaveBeenCalled();
  });

  it('should call onRepick when the current choice is picked again', async () => {
    const onRepick = vi.fn();
    const { onChange } = renderMenu({ onRepick });
    await openMenu('Type: Shows');

    await pickMenuRadio('Shows');

    expect(onRepick).toHaveBeenCalledOnce();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('should not call onRepick when another choice is picked', async () => {
    const onRepick = vi.fn();
    const { onChange } = renderMenu({ onRepick });
    await openMenu('Type: Shows');

    await pickMenuRadio('Movies');

    expect(onChange).toHaveBeenCalledExactlyOnceWith('movie');
    expect(onRepick).not.toHaveBeenCalled();
  });

  it('should pass its font to the trigger', () => {
    renderMenu({ font: 'heading' });

    expect(screen.getByRole('button', { name: 'Type: Shows' }))
      .toHaveAttribute('data-font', 'heading');
  });

  it('should pass its height limit to the menu', async () => {
    renderMenu({ isLimited: true });

    const menu = await openMenu('Type: Shows');

    expect(menu).toHaveAttribute('data-limited');
  });

  describe('with an All row', () => {
    it('should list the All row first and check it under no choice', async () => {
      renderMenu({ value: null, all: 'All Types' });

      await openMenu('Type: All Types');

      expect(readMenuRows('menuitemradio'))
        .toEqual(['All Types', 'Movies', 'Shows']);
      expect(readCheckedMenuRow()).toBe('All Types');
    });

    it('should report no choice when the All row is picked from another', async () => {
      const { onChange } = renderMenu({ all: 'All Types' });
      await openMenu('Type: Shows');

      await pickMenuRadio('All Types');

      expect(onChange).toHaveBeenCalledExactlyOnceWith(null);
    });

    it('should report nothing when the All row is picked again', async () => {
      const { onChange } = renderMenu({ value: null, all: 'All Types' });
      await openMenu('Type: All Types');

      await pickMenuRadio('All Types');
      await waitNegativeClaim();

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  it.each([true, false])(
    'should draw the trigger in the accent while changed is %s',
    (changed) => {
      renderMenu({ changed });

      expect(isTriggerChanged('Type: Shows')).toBe(changed);
      expect(screen.getByRole('button', { name: 'Type: Shows' }))
        .toHaveAttribute('data-selected-tint', 'accent');
    },
  );

  it.each([
    { value: null, name: 'Type: All Types', accented: false },
    { value: 'show' as const, name: 'Type: Shows', accented: true },
  ])(
    'should draw the trigger in the accent, with an All row, only on another choice: $name',
    ({ value, name, accented }) => {
      renderMenu({ value, all: 'All Types' });

      expect(isTriggerChanged(name)).toBe(accented);
    },
  );
});
