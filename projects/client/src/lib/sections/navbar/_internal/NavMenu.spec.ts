import { afterNavigate } from '$app/navigation';
import { page } from '$app/state';
import type { AfterNavigate } from '@sveltejs/kit';
import { WELL_KNOWN_MEDIA_QUERY } from '$lib/stores/css/WELL_KNOWN_MEDIA_QUERY.ts';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { tick } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import NavMenuHost from '$test/beds/navbar/NavMenuHost.svelte';

// useMedia keeps each query's first answer, so the whole spec runs on a mouse.
vi.spyOn(globalThis, 'matchMedia').mockImplementation((query: string) => ({
  matches: query === WELL_KNOWN_MEDIA_QUERY.mouse,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

const profileTrigger = () =>
  screen.getByRole('button', { name: 'Profile menu' });

// Role queries skip hidden elements, so a closed panel reads as null.
const profilePanel = () => screen.queryByRole('menu', { name: 'Profile menu' });

const clickWith = (pointerType: string) =>
  fireEvent(
    profileTrigger(),
    new PointerEvent('click', { bubbles: true, detail: 1, pointerType }),
  );

describe('component: NavMenu', () => {
  it('should open on a trigger click without a pointer and close on the next', async () => {
    render(NavMenuHost);

    expect(profilePanel()).not.toBeInTheDocument();
    expect(profileTrigger()).toHaveAttribute('aria-expanded', 'false');

    await fireEvent.click(profileTrigger());

    expect(profilePanel()).toBeInTheDocument();
    expect(profileTrigger()).toHaveAttribute('aria-expanded', 'true');

    await fireEvent.click(profileTrigger());

    expect(profilePanel()).not.toBeInTheDocument();
    expect(profileTrigger()).toHaveAttribute('aria-expanded', 'false');
  });

  it('should keep the panel in the DOM, hidden, while closed', () => {
    render(NavMenuHost);

    expect(screen.getByLabelText('Profile menu', { selector: '[role="menu"]' }))
      .toHaveAttribute('hidden');
  });

  it('should ignore a mouse-pointer click', async () => {
    render(NavMenuHost);

    await clickWith('mouse');

    expect(profileTrigger()).toHaveAttribute('aria-expanded', 'false');
    expect(profilePanel()).not.toBeInTheDocument();
  });

  it('should open on a touch-pointer click and close on the next', async () => {
    render(NavMenuHost);

    await clickWith('touch');
    const openAfterFirst = profilePanel() !== null;
    await clickWith('touch');

    expect(openAfterFirst).toBe(true);
    expect(profileTrigger()).toHaveAttribute('aria-expanded', 'false');
  });

  it('should not open on a click with a detail but no pointer type', async () => {
    render(NavMenuHost);

    await fireEvent.click(profileTrigger(), { detail: 1 });

    expect(profileTrigger()).toHaveAttribute('aria-expanded', 'false');
    expect(profilePanel()).not.toBeInTheDocument();
  });

  it('should not close on a click with a detail but no pointer type', async () => {
    render(NavMenuHost);
    const user = userEvent.setup();
    profileTrigger().focus();
    await user.keyboard('{Enter}');

    await fireEvent.click(profileTrigger(), { detail: 1 });

    expect(profileTrigger()).toHaveAttribute('aria-expanded', 'true');
    expect(profilePanel()).toBeInTheDocument();
  });

  it('should hand the trigger its open state', async () => {
    render(NavMenuHost);
    const closed = profileTrigger().textContent?.trim();

    await fireEvent.click(profileTrigger());

    expect([closed, profileTrigger().textContent?.trim()])
      .toEqual(['Jane closed', 'Jane open']);
  });

  it('should list the items as menu rows linking to their routes', async () => {
    render(NavMenuHost);

    await fireEvent.click(profileTrigger());

    expect(
      screen.getAllByRole('menuitem').map((row) => [
        row.textContent?.trim(),
        row.getAttribute('href'),
      ]),
    ).toEqual([
      ['History', '/users/me/history'],
      ['Lists', '/users/me/lists'],
      ['Sign Out', null],
    ]);
  });

  it('should mark the row of the current family as the current page', async () => {
    window.history.replaceState(null, '', '/users/me/lists/watched');
    render(NavMenuHost);

    await fireEvent.click(profileTrigger());

    expect(
      screen.getAllByRole('menuitem', { current: 'page' })
        .map((row) => row.textContent?.trim()),
    ).toEqual(['Lists']);
  });

  it('should mark no row on an error page', async () => {
    window.history.replaceState(null, '', '/users/me/lists/unknown');
    page.error = { message: 'Not Found' };
    render(NavMenuHost);

    await fireEvent.click(profileTrigger());

    expect(screen.queryAllByRole('menuitem', { current: 'page' }))
      .toHaveLength(0);
  });

  it('should set the action row apart with a separator', async () => {
    render(NavMenuHost);

    await fireEvent.click(profileTrigger());

    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  describe('when open', () => {
    it('should close on a click outside', async () => {
      render(NavMenuHost);
      await fireEvent.click(profileTrigger());

      await fireEvent.click(screen.getByRole('button', { name: 'Outside' }));

      expect(profilePanel()).not.toBeInTheDocument();
    });

    it('should stay open on a click inside the panel', async () => {
      render(NavMenuHost);
      await fireEvent.click(profileTrigger());

      await fireEvent.click(screen.getByRole('separator'));

      expect(profilePanel()).toBeInTheDocument();
    });

    it.each(['scroll', 'resize'])('should stay open on a window %s', async (
      type,
    ) => {
      render(NavMenuHost);
      await fireEvent.click(profileTrigger());

      await fireEvent(window, new Event(type));

      expect(profilePanel()).toBeInTheDocument();
    });

    it('should close on Escape and focus the trigger', async () => {
      render(NavMenuHost);
      await fireEvent.click(profileTrigger());
      screen.getByRole('menuitem', { name: 'Lists' }).focus();

      await fireEvent.keyDown(document.activeElement ?? document.body, {
        key: 'Escape',
      });

      expect(profilePanel()).not.toBeInTheDocument();
      expect(profileTrigger()).toHaveFocus();
    });
  });

  it('should leave focus in another control on Escape', async () => {
    render(NavMenuHost);
    await fireEvent.click(profileTrigger());
    const outside = screen.getByRole('button', { name: 'Outside' });
    outside.focus();

    await fireEvent.keyDown(outside, { key: 'Escape' });

    expect(profilePanel()).not.toBeInTheDocument();
    expect(outside).toHaveFocus();
  });

  it('should move no focus on Escape while closed', async () => {
    render(NavMenuHost);
    const outside = screen.getByRole('button', { name: 'Outside' });
    outside.focus();

    await fireEvent.keyDown(outside, { key: 'Escape' });

    expect(outside).toHaveFocus();
  });

  describe('keyboard', () => {
    it.each([
      ['Enter', '{Enter}'],
      ['Space', ' '],
    ])('should open on %s on the trigger and close on the next', async (
      _,
      keys,
    ) => {
      render(NavMenuHost);
      const user = userEvent.setup();
      profileTrigger().focus();

      await user.keyboard(keys);
      const openAfterFirst = profilePanel() !== null;
      await user.keyboard(keys);

      expect(openAfterFirst).toBe(true);
      expect(profilePanel()).not.toBeInTheDocument();
    });

    it('should keep the rows out of the tab order', async () => {
      render(NavMenuHost);
      const user = userEvent.setup();
      await fireEvent.click(profileTrigger());
      profileTrigger().focus();

      await user.tab();

      expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    });

    it('should close when Tab moves focus on from the trigger', async () => {
      render(NavMenuHost);
      const user = userEvent.setup();
      await fireEvent.click(profileTrigger());
      profileTrigger().focus();

      await user.tab();

      expect(profilePanel()).not.toBeInTheDocument();
    });

    it('should stay open while ArrowDown moves focus from the trigger into the rows', async () => {
      render(NavMenuHost);
      const user = userEvent.setup();
      await fireEvent.click(profileTrigger());
      profileTrigger().focus();

      await user.keyboard('{ArrowDown}');

      expect(profilePanel()).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: 'History' })).toHaveFocus();
    });

    it.each([
      ['Tab', '{Tab}'],
      ['Shift+Tab', '{Shift>}{Tab}{/Shift}'],
    ])('should close on %s from a row', async (_, keys) => {
      render(NavMenuHost);
      const user = userEvent.setup();
      await fireEvent.click(profileTrigger());
      screen.getByRole('menuitem', { name: 'Lists' }).focus();

      await user.keyboard(keys);

      expect(profilePanel()).not.toBeInTheDocument();
    });

    const press = (key: string) =>
      fireEvent.keyDown(document.activeElement ?? document.body, { key });

    const focusedRow = () => document.activeElement?.textContent?.trim();

    it.each(['ArrowDown', 'ArrowUp', 'Home', 'End'])(
      'should ignore %s while the menu is not toggled open',
      async (key) => {
        render(NavMenuHost);
        profileTrigger().focus();

        await press(key);

        expect(profileTrigger()).toHaveFocus();
        expect(profileTrigger()).toHaveAttribute('aria-expanded', 'false');
      },
    );

    it('should move down the rows, the action row included, and wrap', async () => {
      render(NavMenuHost);
      await fireEvent.click(profileTrigger());
      profileTrigger().focus();

      await press('ArrowDown');
      const first = focusedRow();
      await press('ArrowDown');
      const second = focusedRow();
      await press('ArrowDown');
      const third = focusedRow();
      await press('ArrowDown');

      expect([first, second, third, focusedRow()])
        .toEqual(['History', 'Lists', 'Sign Out', 'History']);
    });

    it('should move up the rows and wrap', async () => {
      render(NavMenuHost);
      await fireEvent.click(profileTrigger());
      screen.getByRole('menuitem', { name: 'History' }).focus();

      await press('ArrowUp');
      const first = focusedRow();
      await press('ArrowUp');

      expect([first, focusedRow()]).toEqual(['Sign Out', 'Lists']);
    });

    it('should jump to the last row on End and the first on Home', async () => {
      render(NavMenuHost);
      await fireEvent.click(profileTrigger());
      profileTrigger().focus();

      await press('End');
      const last = focusedRow();
      await press('Home');

      expect([last, focusedRow()]).toEqual(['Sign Out', 'History']);
    });
  });

  it('should close after a navigation', async () => {
    render(NavMenuHost);
    await fireEvent.click(profileTrigger());

    const [onNavigate] = vi.mocked(afterNavigate).mock.calls.at(0) ?? [];
    onNavigate?.({} as AfterNavigate);
    await tick();

    expect(onNavigate).toBeDefined();
    expect(profilePanel()).not.toBeInTheDocument();
  });

  describe('hover after a navigation', () => {
    const navigate = async () => {
      const [onNavigate] = vi.mocked(afterNavigate).mock.calls.at(0) ?? [];
      onNavigate?.({} as AfterNavigate);
      await tick();
    };

    const profileRoot = () => profileTrigger().closest('.trakt-nav-menu');

    it('should suppress the hover rule after a row click navigates', async () => {
      render(NavMenuHost);
      await fireEvent.click(screen.getByText('Lists'));

      await navigate();

      expect(profileRoot()).toHaveClass('is-hover-suppressed');
    });

    it.each([
      ['trigger', () => profileTrigger()],
      [
        'panel',
        () =>
          screen.getByLabelText('Profile menu', { selector: '[role="menu"]' }),
      ],
    ])('should restore the hover rule when the pointer leaves the %s', async (
      _,
      element,
    ) => {
      render(NavMenuHost);
      await fireEvent.click(screen.getByText('Lists'));
      await navigate();

      await fireEvent.mouseLeave(element());

      expect(profileRoot()).not.toHaveClass('is-hover-suppressed');
    });

    it('should not suppress the hover rule after a navigation from elsewhere', async () => {
      render(NavMenuHost);
      await fireEvent.click(screen.getByRole('button', { name: 'Outside' }));

      await navigate();

      expect(profileRoot()).not.toHaveClass('is-hover-suppressed');
    });
  });

  it('should close the other open menu when one opens', async () => {
    render(NavMenuHost, { props: { withSecondMenu: true } });
    await fireEvent.click(profileTrigger());

    await fireEvent.click(screen.getByRole('button', { name: 'Site menu' }));

    expect(profilePanel()).not.toBeInTheDocument();
    expect(screen.getByRole('menu', { name: 'Site menu' }))
      .toBeInTheDocument();
  });

  it('should still open another menu after an open one is destroyed', async () => {
    const { rerender } = render(NavMenuHost, {
      props: { withSecondMenu: true },
    });
    await fireEvent.click(profileTrigger());
    await rerender({ withProfileMenu: false, withSecondMenu: true });

    await fireEvent.click(screen.getByRole('button', { name: 'Site menu' }));

    expect(screen.getByRole('menu', { name: 'Site menu' }))
      .toBeInTheDocument();
  });
});
