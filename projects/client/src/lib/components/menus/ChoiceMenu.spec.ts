import { pickMenuRadio } from '$test/beds/menus/pickMenuRadio.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { render, screen, within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ChoiceMenu from './ChoiceMenu.svelte';
import type { ChoiceMenuProps } from './_internal/ChoiceMenuProps.ts';

type Kind = 'movie' | 'show';

const PROPS: ChoiceMenuProps<Kind> = {
  label: 'Type',
  triggerLabel: (shown) => `Type: ${shown}`,
  value: 'show',
  choices: [
    { value: 'movie', label: 'Movies' },
    { value: 'show', label: 'Shows' },
  ],
  onChange: () => {},
};

function renderMenu(props: Partial<ChoiceMenuProps<Kind>> = {}) {
  const onChange = vi.fn();
  render(ChoiceMenu<Kind>, { props: { ...PROPS, onChange, ...props } });
  return { onChange };
}

async function openMenu(name: string) {
  await userEvent.click(screen.getByRole('button', { name }));
  return screen.findByRole('menu', { name: 'Type' });
}

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

    const menu = await openMenu('Type: Shows');
    const rows = within(menu).getAllByRole('menuitemradio');

    expect(rows.map((found) => found.textContent?.trim()))
      .toEqual(['Movies', 'Shows']);
    expect(rows.map((found) => found.getAttribute('aria-checked')))
      .toEqual(['false', 'true']);
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

      const menu = await openMenu('Type: All Types');
      const rows = within(menu).getAllByRole('menuitemradio');

      expect(rows.map((found) => found.textContent?.trim()))
        .toEqual(['All Types', 'Movies', 'Shows']);
      expect(rows.map((found) => found.getAttribute('aria-checked')))
        .toEqual(['true', 'false', 'false']);
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
});
