import { mountElement } from '$test/beds/dom/mountElement.ts';
import MenuHost from '$test/beds/menus/MenuHost.svelte';
import { openMenuFromKeyboard } from '$test/beds/menus/openMenuFromKeyboard.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { render, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import { userEvent } from '@testing-library/user-event';
import { openMenuIn, watchMenusIn } from './openMenus.ts';

const trigger = () => screen.getByRole('button', { name: 'Rank' });

function renderMenu() {
  return render(MenuHost, { props: { onSelect: vi.fn() } });
}

beforeEach(() => {
  stubClientRects();
});

describe('openMenus', () => {
  describe('openMenuIn', () => {
    it('should find the open menu whose trigger is in the region', async () => {
      const { container } = renderMenu();
      expect(openMenuIn(container)).toBeUndefined();

      await openMenuFromKeyboard(trigger(), 'Added Date');

      expect(openMenuIn(container)?.trigger).toBe(trigger());
    });

    it('should not find an open menu whose trigger is outside the region', async () => {
      renderMenu();

      await openMenuFromKeyboard(trigger(), 'Added Date');

      expect(openMenuIn(mountElement('div'))).toBeUndefined();
    });
  });

  describe('contains', () => {
    it('should hold the menu in its portal, outside the region', async () => {
      const { container } = renderMenu();
      await openMenuFromKeyboard(trigger(), 'Added Date');
      const item = screen.getByRole('menuitem', { name: 'Added Date' });

      const menu = openMenuIn(container);

      expect(container.contains(item)).toBe(false);
      expect(menu?.contains(item)).toBe(true);
      expect(menu?.contains(trigger())).toBe(false);
      expect(menu?.contains(null)).toBe(false);
    });
  });

  describe('close', () => {
    it('should close the menu and return focus to its trigger', async () => {
      const { container } = renderMenu();
      await openMenuFromKeyboard(trigger(), 'Added Date');

      openMenuIn(container)?.close();

      await waitFor(() =>
        expect(screen.queryByRole('menu', { name: 'Sort by' })).not
          .toBeInTheDocument()
      );
      expect(trigger()).toHaveFocus();
      expect(trigger()).toHaveAttribute('aria-expanded', 'false');
      expect(openMenuIn(container)).toBeUndefined();
    });
  });

  describe('watchMenusIn', () => {
    function watch(region: HTMLElement) {
      const onToggle = vi.fn();
      onTestFinished(watchMenusIn(region, onToggle));
      return onToggle;
    }

    it('should report the open and the close of a menu in the region', async () => {
      const { container } = renderMenu();
      const onToggle = watch(container);

      await openMenuFromKeyboard(trigger(), 'Added Date');
      expect(onToggle.mock.calls).toEqual([[trigger(), true]]);

      await userEvent.keyboard('{Escape}');

      await waitFor(() =>
        expect(onToggle.mock.calls).toEqual([
          [trigger(), true],
          [trigger(), false],
        ])
      );
    });

    it('should not report a menu outside the region', async () => {
      renderMenu();
      const onToggle = watch(mountElement('div'));

      await openMenuFromKeyboard(trigger(), 'Added Date');
      await waitNegativeClaim();

      expect(onToggle).not.toHaveBeenCalled();
    });

    it('should release a menu destroyed while open', async () => {
      const { container, unmount } = renderMenu();
      const onToggle = watch(container);
      await openMenuFromKeyboard(trigger(), 'Added Date');
      const opened = trigger();

      unmount();

      expect(openMenuIn(document.body)).toBeUndefined();
      expect(onToggle.mock.calls).toEqual([[opened, true], [opened, false]]);
    });
  });
});
