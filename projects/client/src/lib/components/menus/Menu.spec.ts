import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { tick } from 'svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setDocumentDirection } from '$test/beds/direction/setDocumentDirection.ts';
import { controlledBy } from '$test/beds/dom/controlledBy.ts';
import { closeFromOutside } from '$test/beds/menus/closeFromOutside.ts';
import MenuHost from '$test/beds/menus/MenuHost.svelte';
import { openMenuByClick } from '$test/beds/menus/openMenuByClick.ts';
import { openMenuFromKeyboard } from '$test/beds/menus/openMenuFromKeyboard.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';

const trigger = () => screen.getByRole('button', { name: 'Rank' });
const menu = () => screen.queryByRole('menu', { name: 'Sort by' });
const openMenu = () => openMenuByClick('Rank', 'Sort by');

beforeEach(() => {
  stubClientRects();
});

describe('component: Menu', () => {
  it('should open from the trigger, named by its label', async () => {
    render(MenuHost, { props: { onSelect: vi.fn() } });

    expect(menu()).not.toBeInTheDocument();

    expect(await openMenu()).toBeVisible();
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
  });

  it('should name its menu in the open trigger', async () => {
    render(MenuHost, { props: { onSelect: vi.fn() } });

    const opened = await openMenu();

    expect(controlledBy(trigger())).toBe(opened);
  });

  it('should select an item, close and focus the trigger', async () => {
    const onSelect = vi.fn();
    render(MenuHost, { props: { onSelect } });
    await openMenu();

    await userEvent.click(screen.getByRole('menuitem', { name: 'Added Date' }));

    expect(onSelect).toHaveBeenCalledExactlyOnceWith('added');
    await waitFor(() => expect(menu()).not.toBeInTheDocument());
    expect(trigger()).toHaveFocus();
  });

  it('should return focus to the trigger after an outside click closes the menu', async () => {
    render(MenuHost, { props: { onSelect: vi.fn() } });
    await openMenu();
    const focus = vi.spyOn(trigger(), 'focus');

    await closeFromOutside(menu);

    expect(trigger()).toHaveFocus();
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it('should stay open after an item that keeps it open', async () => {
    const onSelect = vi.fn();
    render(MenuHost, { props: { onSelect } });
    await openMenu();

    await userEvent.click(screen.getByRole('menuitem', { name: 'Title' }));
    await tick();

    expect(onSelect).toHaveBeenCalledExactlyOnceWith('title');
    expect(menu()).toBeVisible();
  });

  it.each([true, false])(
    'should expose a checked state of %s as a checkbox item',
    async (checked) => {
      render(MenuHost, { props: { onSelect: vi.fn(), checked } });
      await openMenu();

      expect(screen.getByRole('menuitemcheckbox', { name: 'Watchlist' }))
        .toHaveAttribute('aria-checked', String(checked));
    },
  );

  it('should render an item without a checked state as a plain item', async () => {
    render(MenuHost, { props: { onSelect: vi.fn(), checked: false } });
    await openMenu();

    expect(
      screen.getAllByRole('menuitem').map((item) => item.textContent?.trim()),
    )
      .toEqual(['Added Date', 'Title']);
  });

  it('should turn a plain item into a checkbox item once it has a checked state', async () => {
    const onSelect = vi.fn();
    const { rerender } = render(MenuHost, {
      props: { onSelect, checked: undefined },
    });
    await openMenu();

    expect(screen.getByRole('menuitem', { name: 'Watchlist' })).not
      .toHaveAttribute('aria-checked');

    await rerender({ onSelect, checked: true });

    expect(screen.getByRole('menuitemcheckbox', { name: 'Watchlist' }))
      .toHaveAttribute('aria-checked', 'true');
  });

  it('should leave the checked state to the caller on select', async () => {
    const onSelect = vi.fn();
    const { rerender } = render(MenuHost, {
      props: { onSelect, checked: false },
    });
    await openMenu();
    const item = screen.getByRole('menuitemcheckbox', { name: 'Watchlist' });

    await userEvent.click(item);
    await tick();

    expect(onSelect).toHaveBeenCalledExactlyOnceWith('watchlist');
    expect(item).toHaveAttribute('aria-checked', 'false');

    await rerender({ onSelect, checked: true });

    expect(item).toHaveAttribute('aria-checked', 'true');
  });

  it('should show the spinner on an item whose state is unknown', async () => {
    render(MenuHost, { props: { onSelect: vi.fn(), checked: 'unknown' } });
    await openMenu();

    const item = screen.getByRole('menuitemcheckbox', { name: 'Watchlist' });

    expect(item.querySelector('.tabler-icon-loader-2')).not.toBeNull();
    expect(item).toHaveAttribute('aria-checked', 'false');
  });

  it.each(['ltr', 'rtl'])(
    'should lay its menu out in a %s document',
    async (dir) => {
      setDocumentDirection(dir);
      render(MenuHost, { props: { onSelect: vi.fn() } });

      expect((await openMenu()).matches(`:dir(${dir})`)).toBe(true);
    },
  );

  it.each([
    { isLimited: true, limited: true },
    { isLimited: false, limited: false },
    { isLimited: undefined, limited: false },
  ])(
    'should mark the limit on its menu at isLimited $isLimited',
    async ({ isLimited, limited }) => {
      render(MenuHost, { props: { onSelect: vi.fn(), isLimited } });

      expect((await openMenu()).hasAttribute('data-limited')).toBe(limited);
    },
  );

  describe('from the keyboard', () => {
    it.each([['Enter', '{Enter}'], ['Space', ' ']])(
      'should select a checkbox item with %s and stay open',
      async (_name, key) => {
        const onSelect = vi.fn();
        render(MenuHost, { props: { onSelect, checked: false } });
        await openMenuFromKeyboard(trigger(), 'Added Date');

        await userEvent.keyboard('{End}');
        expect(screen.getByRole('menuitemcheckbox', { name: 'Watchlist' }))
          .toHaveFocus();
        await userEvent.keyboard(key);
        await tick();

        expect(onSelect).toHaveBeenCalledExactlyOnceWith('watchlist');
        expect(menu()).toBeVisible();
      },
    );

    it('should select an item with Enter, close and focus the trigger', async () => {
      const onSelect = vi.fn();
      render(MenuHost, { props: { onSelect } });
      await openMenuFromKeyboard(trigger(), 'Added Date');

      await userEvent.keyboard('{Enter}');

      expect(onSelect).toHaveBeenCalledExactlyOnceWith('added');
      await waitFor(() => expect(menu()).not.toBeInTheDocument());
      expect(trigger()).toHaveFocus();
    });

    it('should close on Escape and focus the trigger', async () => {
      render(MenuHost, { props: { onSelect: vi.fn() } });
      await openMenuFromKeyboard(trigger(), 'Added Date');

      await userEvent.keyboard('{Escape}');

      await waitFor(() => expect(menu()).not.toBeInTheDocument());
      expect(trigger()).toHaveFocus();
    });
  });

  describe('while inert', () => {
    it('should mark its trigger aria-disabled and leave it enabled', () => {
      render(MenuHost, { props: { onSelect: vi.fn(), isInert: true } });

      expect(trigger()).toHaveAttribute('aria-disabled', 'true');
      expect(trigger()).not.toHaveAttribute('disabled');
    });

    it.each([
      {
        way: 'a click',
        press: (target: HTMLElement) => userEvent.click(target),
      },
      { way: 'Enter', press: () => userEvent.keyboard('{Enter}') },
      { way: 'Space', press: () => userEvent.keyboard(' ') },
      { way: 'Arrow Down', press: () => userEvent.keyboard('{ArrowDown}') },
      {
        way: 'a touch',
        press: (target: HTMLElement) =>
          userEvent.pointer({ keys: '[TouchA]', target }),
      },
    ])('should stay closed on $way and keep the focus', async ({ press }) => {
      render(MenuHost, { props: { onSelect: vi.fn(), isInert: true } });
      trigger().focus();

      await press(trigger());
      await waitNegativeClaim();

      expect(menu()).not.toBeInTheDocument();
      expect(trigger()).toHaveAttribute('aria-expanded', 'false');
      expect(trigger()).toHaveFocus();
    });

    it('should open from its trigger once no longer inert', async () => {
      const onSelect = vi.fn();
      const { rerender } = render(MenuHost, {
        props: { onSelect, isInert: true },
      });

      await rerender({ onSelect, isInert: false });

      expect(trigger()).not.toHaveAttribute('aria-disabled');
      expect(await openMenu()).toBeVisible();
    });

    it('should keep its open trigger live and close from it', async () => {
      const onSelect = vi.fn();
      const { rerender } = render(MenuHost, { props: { onSelect } });
      await openMenu();

      await rerender({ onSelect, isInert: true });

      expect(trigger()).not.toHaveAttribute('aria-disabled');
      // VoiceOver activates with a click of no detail; the scroll lock keeps a press off the trigger.
      await fireEvent.click(trigger(), { detail: 0 });

      await waitFor(() => expect(menu()).not.toBeInTheDocument());
      expect(trigger()).toHaveAttribute('aria-expanded', 'false');
      expect(trigger()).toHaveAttribute('aria-disabled', 'true');

      await fireEvent.click(trigger(), { detail: 0 });
      await waitNegativeClaim();

      expect(menu()).not.toBeInTheDocument();
    });
  });
});
