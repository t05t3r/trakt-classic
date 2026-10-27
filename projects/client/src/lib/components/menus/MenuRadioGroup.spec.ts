import RadioMenuHost from '$test/beds/menus/RadioMenuHost.svelte';
import { glyphClasses } from '$test/beds/menus/glyphClasses.ts';
import { openMenuFromKeyboard } from '$test/beds/menus/openMenuFromKeyboard.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { render, screen, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const trigger = () => screen.getByRole('button', { name: 'Rank' });
const row = (name: string) => screen.getByRole('menuitemradio', { name });
const openMenu = async () => {
  await userEvent.click(trigger());
  return screen.findByRole('menu', { name: 'Sort by' });
};

beforeEach(() => {
  stubClientRects();
});

describe('component: MenuRadioGroup', () => {
  it('should check the row of its value', async () => {
    render(RadioMenuHost, {
      props: { value: 'title', onValueChange: vi.fn() },
    });
    await openMenu();

    expect(row('Title')).toHaveAttribute('aria-checked', 'true');
    expect(row('Added Date')).toHaveAttribute('aria-checked', 'false');
    expect(glyphClasses(row('Title'))).toEqual([
      expect.stringContaining('tabler-icon-check'),
    ]);
    expect(glyphClasses(row('Added Date'))).toEqual([]);
  });

  it('should check no row while its value is null', async () => {
    render(RadioMenuHost, { props: { value: null, onValueChange: vi.fn() } });
    await openMenu();

    expect(row('Title')).toHaveAttribute('aria-checked', 'false');
    expect(row('Added Date')).toHaveAttribute('aria-checked', 'false');
  });

  it('should emit the value of another row it selects', async () => {
    const onValueChange = vi.fn();
    render(RadioMenuHost, { props: { value: 'title', onValueChange } });
    await openMenu();

    await userEvent.click(row('Added Date'));

    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('added');
  });

  it('should emit null when it selects the checked row', async () => {
    const onValueChange = vi.fn();
    render(RadioMenuHost, { props: { value: 'title', onValueChange } });
    await openMenu();

    await userEvent.click(row('Title'));

    expect(onValueChange).toHaveBeenCalledExactlyOnceWith(null);
  });

  it('should keep the checked row until its caller changes the value', async () => {
    render(RadioMenuHost, {
      props: { value: 'title', onValueChange: vi.fn() },
    });
    await openMenu();
    await userEvent.click(row('Added Date'));
    await waitFor(() => expect(trigger()).toHaveFocus());
    await userEvent.keyboard('{Enter}');
    await screen.findByRole('menu', { name: 'Sort by' });

    expect(row('Title')).toHaveAttribute('aria-checked', 'true');
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
