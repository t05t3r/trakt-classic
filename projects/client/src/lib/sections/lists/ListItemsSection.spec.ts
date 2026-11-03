import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { WATCHLIST_PATH } from '$mocks/data/users/WATCHLIST_PATH.ts';
import { REMOVALS } from '$test/beds/focus/REMOVALS.ts';
import ListItemsSectionHost from '$test/beds/lists/ListItemsSectionHost.svelte';
import { openMenuByTouch } from '$test/beds/menus/openMenuByTouch.ts';
import { openMenuFromKeyboard } from '$test/beds/menus/openMenuFromKeyboard.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { openAt } from '$test/beds/url/openAt.ts';
import { render, screen, waitFor, within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const ENTRIES = [
  { id: 1, title: 'Heretic' },
  { id: 2, title: 'Silo' },
];

const READY = { kind: 'ready', data: ENTRIES } as const;

const DEVS = { id: 3, title: 'Devs' };

const gear = () => screen.getByRole('button', { name: 'List options' });
const toolbar = () => screen.getByTestId('toolbar');
const blurFocused = () => {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
};

describe('section: ListItemsSection', () => {
  beforeEach(() => {
    openAt(WATCHLIST_PATH);
  });

  describe('the phone panel', () => {
    it('should hand the toolbar the panel the gear controls, closed at first', () => {
      render(ListItemsSectionHost, { props: { status: READY } });

      expect(toolbar()).toHaveTextContent('Panel closed');
      expect(gear()).toHaveAttribute('aria-controls', toolbar().id);
      expect(gear()).toHaveAttribute('aria-expanded', 'false');
    });

    it('should open and close the panel on the gear', async () => {
      render(ListItemsSectionHost, { props: { status: READY } });

      await userEvent.click(gear());
      expect(toolbar()).toHaveTextContent('Panel open');
      expect(gear()).toHaveAttribute('aria-expanded', 'true');

      await userEvent.click(gear());
      expect(toolbar()).toHaveTextContent('Panel closed');
    });

    it("should move the focus to the panel's first control when the gear opens it", async () => {
      render(ListItemsSectionHost, { props: { status: READY } });

      await userEvent.click(gear());

      expect(within(toolbar()).getByRole('button', { name: 'Rank' }))
        .toHaveFocus();
    });

    it('should leave the focus on the gear when the gear closes the panel', async () => {
      render(ListItemsSectionHost, { props: { status: READY } });

      await userEvent.click(gear());
      await userEvent.click(gear());

      expect(gear()).toHaveFocus();
    });

    it('should close the panel on Escape and return the focus to the gear', async () => {
      render(ListItemsSectionHost, { props: { status: READY } });

      await userEvent.click(gear());
      screen.getByRole('link', { name: 'Watchlist' }).focus();
      await userEvent.keyboard('{Escape}');

      expect(toolbar()).toHaveTextContent('Panel closed');
      expect(gear()).toHaveFocus();
    });

    it('should leave the panel open on an Escape from a focused element outside the section', async () => {
      render(ListItemsSectionHost, { props: { status: READY } });

      await userEvent.click(gear());
      const outside = screen.getByRole('button', { name: 'Outside' });
      outside.focus();
      await userEvent.keyboard('{Escape}');

      expect(toolbar()).toHaveTextContent('Panel open');
      expect(outside).toHaveFocus();
    });

    it('should close the panel on an Escape with nothing focused', async () => {
      render(ListItemsSectionHost, { props: { status: READY } });

      await userEvent.click(gear());
      blurFocused();
      expect(document.activeElement).toBe(document.body);
      await userEvent.keyboard('{Escape}');

      expect(toolbar()).toHaveTextContent('Panel closed');
      expect(gear()).toHaveFocus();
    });

    it('should leave the panel open on a click outside it', async () => {
      render(ListItemsSectionHost, { props: { status: READY } });

      await userEvent.click(gear());
      await userEvent.click(screen.getByRole('button', { name: 'Outside' }));

      expect(toolbar()).toHaveTextContent('Panel open');
    });

    it('should close only the menu on an Escape in a menu inside it', async () => {
      stubClientRects();
      render(ListItemsSectionHost, { props: { status: READY } });

      await userEvent.click(gear());
      const rank = within(toolbar()).getByRole('button', { name: 'Rank' });
      await openMenuFromKeyboard(rank, 'Added Date');
      await userEvent.keyboard('{Escape}');

      await waitFor(() =>
        expect(screen.queryByRole('menu', { name: 'Sort by' }))
          .not.toBeInTheDocument()
      );
      expect(toolbar()).toHaveTextContent('Panel open');
      expect(rank).toHaveFocus();
    });

    it('should close the panel on a choice in it and return the focus to the gear', async () => {
      stubClientRects();
      render(ListItemsSectionHost, { props: { status: READY } });

      await userEvent.click(gear());
      const rank = within(toolbar()).getByRole('button', { name: 'Rank' });
      await openMenuFromKeyboard(rank, 'Added Date');
      await userEvent.keyboard('{Enter}');

      await waitFor(() =>
        expect(screen.queryByRole('menu', { name: 'Sort by' }))
          .not.toBeInTheDocument()
      );
      await waitNegativeClaim();
      expect(toolbar()).toHaveTextContent('Panel closed');
      expect(gear()).toHaveFocus();
    });

    it('should not move the focus on Escape while the panel is closed', async () => {
      render(ListItemsSectionHost, { props: { status: READY } });

      const outside = screen.getByRole('button', { name: 'Outside' });
      outside.focus();
      await userEvent.keyboard('{Escape}');

      expect(outside).toHaveFocus();
    });
  });

  describe('states', () => {
    it.each(
      [
        { kind: 'loading' },
        { kind: 'empty' },
        { kind: 'error', retry: vi.fn() },
        READY,
      ] as const,
    )(
      'should keep the toolbar, title bar and description while $kind',
      (status) => {
        render(ListItemsSectionHost, { props: { status } });

        expect(toolbar()).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 2, name: 'Watchlist' }))
          .toBeInTheDocument();
        expect(screen.getByText('Movies I plan to watch.')).toBeInTheDocument();
      },
    );

    it('should mark the body busy and the title pending while loading', () => {
      const { container } = render(ListItemsSectionHost, {
        props: { status: { kind: 'loading' } },
      });

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading.querySelector('.trakt-pending-spinner')).not.toBeNull();
      expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
      expect(container.querySelector('.trakt-poster-grid')).toBeNull();
    });

    it('should show the empty text once the List is empty', () => {
      const { container } = render(ListItemsSectionHost, {
        props: { status: { kind: 'empty' } },
      });

      expect(screen.getByText('Nothing to watch yet.')).toBeVisible();
      expect(container.querySelector('[aria-busy="true"]')).toBeNull();
    });

    it('should offer a retry described by the title when the items fail', async () => {
      const retry = vi.fn();
      render(ListItemsSectionHost, {
        props: { status: { kind: 'error', retry } },
      });

      const button = screen.getByRole('button', { name: 'Retry' });
      expect(button).toHaveAccessibleDescription('Watchlist');

      await userEvent.click(button);
      expect(retry).toHaveBeenCalledOnce();
    });

    it('should render a card for each item once ready', () => {
      const { container } = render(ListItemsSectionHost, {
        props: { status: READY },
      });

      const cells = container.querySelectorAll(
        '.trakt-poster-grid .host-card',
      );
      expect(Array.from(cells, (cell) => cell.textContent)).toEqual([
        'Heretic',
        'Silo',
      ]);
    });
  });

  describe('a card that leaves with the focus', () => {
    const ready = (data: ReadonlyArray<typeof DEVS>) =>
      ({ kind: 'ready', data }) as const;
    const card = (name: string) => screen.getByRole('button', { name });
    const menuOf = (name: string) =>
      screen.queryByRole('menu', { name: `Menu ${name}` });

    it.each(REMOVALS)(
      'should move the focus to the next card, where removal $removal',
      async ({ emulate }) => {
        const { rerender } = render(ListItemsSectionHost, {
          props: { status: ready([...ENTRIES, DEVS]) },
        });
        emulate();

        card('Silo').focus();
        await rerender({
          status: ready([assertDefined(ENTRIES.at(0)), DEVS]),
        });

        expect(card('Devs')).toHaveFocus();
      },
    );

    it.each(REMOVALS)(
      'should move the focus to the previous card at the end, where removal $removal',
      async ({ emulate }) => {
        const { rerender } = render(ListItemsSectionHost, {
          props: { status: ready([...ENTRIES, DEVS]) },
        });
        emulate();

        card('Devs').focus();
        await rerender({ status: READY });

        expect(card('Silo')).toHaveFocus();
      },
    );

    it.each(REMOVALS)(
      'should hold the focus in the body when the last card leaves, where removal $removal',
      async ({ emulate }) => {
        const { container, rerender } = render(ListItemsSectionHost, {
          props: { status: READY },
        });
        emulate();

        card('Silo').focus();
        await rerender({ status: { kind: 'empty' } });

        expect(container.querySelector('[aria-busy]')).toHaveFocus();
      },
    );

    it.each(REMOVALS)(
      'should move the focus to the next card when a card leaves with its menu open, where removal $removal',
      async ({ emulate }) => {
        stubClientRects();
        const { rerender } = render(ListItemsSectionHost, {
          props: { status: ready([...ENTRIES, DEVS]) },
        });
        await openMenuFromKeyboard(card('Silo'), 'Untick Silo');
        emulate();

        await rerender({
          status: ready([assertDefined(ENTRIES.at(0)), DEVS]),
        });

        await waitFor(() => expect(menuOf('Silo')).not.toBeInTheDocument());
        await waitFor(() => expect(card('Devs')).toHaveFocus());
      },
    );

    it.each(REMOVALS)(
      'should move the focus to the next card when a card leaves with a menu opened by touch, where removal $removal',
      async ({ emulate }) => {
        stubClientRects();
        const { rerender } = render(ListItemsSectionHost, {
          props: { status: ready([...ENTRIES, DEVS]) },
        });
        await openMenuByTouch(card('Silo'), 'Menu Silo');
        emulate();

        await rerender({
          status: ready([assertDefined(ENTRIES.at(0)), DEVS]),
        });

        await waitFor(() => expect(menuOf('Silo')).not.toBeInTheDocument());
        await waitFor(() => expect(card('Devs')).toHaveFocus());
      },
    );

    it('should leave the focus where it was moved when a card with an open menu leaves', async () => {
      stubClientRects();
      const { rerender } = render(ListItemsSectionHost, {
        props: { status: ready([...ENTRIES, DEVS]) },
      });
      await openMenuFromKeyboard(card('Silo'), 'Untick Silo');
      const outside = screen.getByRole('button', { name: 'Outside' });
      outside.focus();

      await rerender({
        status: ready([assertDefined(ENTRIES.at(0)), DEVS]),
      });
      await waitFor(() => expect(menuOf('Silo')).not.toBeInTheDocument());
      await waitNegativeClaim();

      expect(outside).toHaveFocus();
    });
  });

  describe('pagination', () => {
    it('should place no page links for a single page', () => {
      render(ListItemsSectionHost, { props: { status: READY, total: 1 } });

      expect(screen.queryAllByRole('navigation')).toEqual([]);
    });

    it('should place no page links around the empty text for a single page', () => {
      render(ListItemsSectionHost, {
        props: { status: { kind: 'empty' }, total: 1 },
      });

      expect(screen.getByText('Nothing to watch yet.')).toBeVisible();
      expect(screen.queryAllByRole('navigation')).toEqual([]);
    });

    it('should place page links above and below the empty text past one page', () => {
      render(ListItemsSectionHost, {
        props: { status: { kind: 'empty' }, total: 3 },
      });

      const top = screen.getByRole('navigation', { name: 'Pagination, top' });
      const bottom = screen.getByRole('navigation', {
        name: 'Pagination, bottom',
      });
      const empty = screen.getByText('Nothing to watch yet.');

      expect(top.compareDocumentPosition(empty))
        .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
      expect(bottom.compareDocumentPosition(empty))
        .toBe(Node.DOCUMENT_POSITION_PRECEDING);
    });

    it('should place page links above and below the grid past one page', () => {
      const { container } = render(ListItemsSectionHost, {
        props: { status: READY, total: 3 },
      });

      const top = screen.getByRole('navigation', { name: 'Pagination, top' });
      const bottom = screen.getByRole('navigation', {
        name: 'Pagination, bottom',
      });
      const grid = assertDefined(container.querySelector('.trakt-poster-grid'));

      expect(top.compareDocumentPosition(grid))
        .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
      expect(bottom.compareDocumentPosition(grid))
        .toBe(Node.DOCUMENT_POSITION_PRECEDING);
    });
  });
});
