import RadioMenuHost from '$test/beds/menus/RadioMenuHost.svelte';
import { isMenuRowChecked } from '$test/beds/subnav/isMenuRowChecked.ts';
import { glyphClasses } from '$test/beds/menus/glyphClasses.ts';
import { openMenuByClick } from '$test/beds/menus/openMenuByClick.ts';
import { openMenuFromKeyboard } from '$test/beds/menus/openMenuFromKeyboard.ts';
import { pickMenuRadio } from '$test/beds/menus/pickMenuRadio.ts';
import { readCheckedMenuRow } from '$test/beds/menus/readCheckedMenuRow.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { render, screen, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const trigger = () => screen.getByRole('button', { name: 'Rank' });
const row = (name: string) => screen.getByRole('menuitemradio', { name });
const openMenu = () => openMenuByClick('Rank', 'Sort by');

beforeEach(() => {
  stubClientRects();
});

describe('component: MenuRadioGroup', () => {
  it('should check the row of its value', async () => {
    render(RadioMenuHost, {
      props: { value: 'title', onValueChange: vi.fn() },
    });
    await openMenu();

    expect(readCheckedMenuRow()).toBe('Title');
    expect(glyphClasses(row('Title'))).toEqual([
      expect.stringContaining('tabler-icon-check'),
    ]);
    expect(glyphClasses(row('Added Date'))).toEqual([]);
    expect(isMenuRowChecked(row('Title'))).toBe(true);
    expect(isMenuRowChecked(row('Added Date'))).toBe(false);
  });

  it('should check no row while its value is null', async () => {
    render(RadioMenuHost, { props: { value: null, onValueChange: vi.fn() } });
    await openMenu();

    expect(readCheckedMenuRow()).toBeUndefined();
  });

  it('should emit the value of another row it selects', async () => {
    const onValueChange = vi.fn();
    render(RadioMenuHost, { props: { value: 'title', onValueChange } });
    await openMenu();

    await pickMenuRadio('Added Date');

    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('added');
  });

  it('should emit null when it selects the checked row', async () => {
    const onValueChange = vi.fn();
    render(RadioMenuHost, { props: { value: 'title', onValueChange } });
    await openMenu();

    await pickMenuRadio('Title');

    expect(onValueChange).toHaveBeenCalledExactlyOnceWith(null);
  });

  it('should keep the checked row until its caller changes the value', async () => {
    render(RadioMenuHost, {
      props: { value: 'title', onValueChange: vi.fn() },
    });
    await openMenu();
    await pickMenuRadio('Added Date');
    await waitFor(() => expect(trigger()).toHaveFocus());
    await userEvent.keyboard('{Enter}');
    await screen.findByRole('menu', { name: 'Sort by' });

    expect(readCheckedMenuRow()).toBe('Title');
  });

  it('should select a row from the keyboard and focus the trigger', async () => {
    const onValueChange = vi.fn();
    render(RadioMenuHost, { props: { value: null, onValueChange } });

    await openMenuFromKeyboard(trigger(), 'Added Date');
    await userEvent.keyboard('{Enter}');

    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('added');
    await waitFor(() => expect(trigger()).toHaveFocus());
  });
});
