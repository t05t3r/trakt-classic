import { WELL_KNOWN_MEDIA_QUERY } from '$lib/stores/css/WELL_KNOWN_MEDIA_QUERY.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { fakeLayouts } from '$test/beds/css/fakeLayouts.ts';
import { blurOnMoveAndRemoval } from '$test/beds/focus/blurOnMoveAndRemoval.ts';
import { honourInert } from '$test/beds/focus/honourInert.ts';
import { REMOVALS } from '$test/beds/focus/REMOVALS.ts';
import MenuHost from '$test/beds/menus/MenuHost.svelte';
import { openMenuByTouch } from '$test/beds/menus/openMenuByTouch.ts';
import { openMenuFromKeyboard } from '$test/beds/menus/openMenuFromKeyboard.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import RowRevealGridHost from '$test/beds/pagination/RowRevealGridHost.svelte';
import RowRevealMenuGridHost from '$test/beds/pagination/RowRevealMenuGridHost.svelte';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { type ComponentProps, createRawSnippet, tick } from 'svelte';
import {
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  onTestFinished,
  vi,
} from 'vitest';
import type { RowReveal } from './RowReveal.ts';
import RowRevealGrid from './RowRevealGrid.svelte';

type Poster = { id: number };

const setLayout = fakeLayouts({
  desktop: null,
  tablet: WELL_KNOWN_MEDIA_QUERY.tabletSmall,
  mobile: WELL_KNOWN_MEDIA_QUERY.mobile,
});

function posters(count: number): Poster[] {
  return Array.from({ length: count }, (_, index) => ({ id: index + 1 }));
}

const item = createRawSnippet((poster: () => Poster) => ({
  render: () => `<span>Poster ${poster().id}</span>`,
}));

async function renderGrid(
  {
    count,
    rowCount,
    navigator,
    variant,
    bottomGap,
    phoneRows,
    phoneCellGap,
  }: {
    count: number;
    rowCount: number;
    navigator?: 'always' | 'mobile' | 'none';
    variant?: 'posters' | 'fanart';
    bottomGap?: 'default' | 'none';
    phoneRows?: 'desktop' | 'mobile';
    phoneCellGap?: 'default' | 'none';
  },
) {
  const { userLoaded } = renderComponent(RowRevealGrid<Poster>, {
    props: {
      items: posters(count),
      key: (poster: Poster) => poster.id,
      columns: { desktop: 6, tablet: 4, mobile: 2 },
      rowMax: 3,
      rowCount,
      item,
      navigator,
      variant,
      bottomGap,
      phoneRows,
      phoneCellGap,
    },
  });
  await userLoaded;
  await screen.findByText('Poster 1');
}

function collapsedCells() {
  return Array.from(document.querySelectorAll('.row-reveal-cell.is-collapsed'));
}

const controls = createRawSnippet((poster: () => Poster) => ({
  render: () =>
    `<div><button>Watch ${poster().id}</button><button>List ${poster().id}</button></div>`,
}));

// A cell whose expanded control opens a panel of its own, not a menu, so it
// does not hold the cell once focus left it.
const openDisclosure = createRawSnippet((poster: () => Poster) => ({
  render: () =>
    `<div><button aria-expanded="true" aria-controls="panel-${poster().id}">Details ${poster().id}</button><div id="panel-${poster().id}"></div></div>`,
}));

// A grid of cells with two buttons each, whose items and rows the test sets.
// It renders no provider, so a rerender reaches its props.
async function renderFocusGrid(
  { ids, rowCount, item = controls }: {
    ids: number[];
    rowCount: number;
    item?: typeof controls;
  },
) {
  const props = (ids: number[], rowCount: number) => ({
    items: ids.map((id) => ({ id })),
    key: (poster: Poster) => poster.id,
    columns: { desktop: 6, tablet: 4, mobile: 2 },
    rowMax: 3,
    rowCount,
    item,
    fallbackFocus: (grid: HTMLElement) => grid.parentElement,
  });
  const { rerender, unmount } = render(RowRevealGrid<Poster>, {
    props: props(ids, rowCount),
  });
  const grid = document.querySelector<HTMLElement>('.trakt-row-reveal-grid');
  const fallback = grid?.parentElement;
  if (!fallback) throw new Error('no grid');

  return {
    fallback,
    unmount,
    update: async (ids: number[], nextRowCount = rowCount) => {
      await rerender(props(ids, nextRowCount));
      await tick();
    },
  };
}

// A grid whose cells each hold a real menu, whose ids and rows the test sets.
async function renderMenuGrid({ ids, rowCount }: {
  ids: ReadonlyArray<number>;
  rowCount: number;
}) {
  stubClientRects();
  honourInert();
  const { rerender } = render(RowRevealMenuGridHost, {
    props: { ids, rowCount },
  });
  const grid = document.querySelector<HTMLElement>('.trakt-row-reveal-grid');
  const fallback = grid?.parentElement;
  if (!fallback) throw new Error('no grid');

  return {
    fallback,
    update: async (ids: ReadonlyArray<number>) => {
      await rerender({ ids, rowCount });
      await tick();
    },
  };
}

const menuOf = (id: number) =>
  screen.queryByRole('menu', { name: `Menu ${id}` });

const MOVES = [
  { move: 'drops it with no event', emulate: () => {} },
  { move: 'blurs it', emulate: blurOnMoveAndRemoval },
];

const button = (name: string) => screen.getByRole('button', { name });

const lessButton = () => screen.queryByRole('button', { name: 'less' });
const moreButton = () => screen.queryByRole('button', { name: 'more' });

describe('component: RowRevealGrid', () => {
  beforeEach(() => {
    setLayout('desktop');
  });

  it('should show only less when all three rows are open', async () => {
    await renderGrid({ count: 17, rowCount: 3 });

    expect(lessButton()).toBeInTheDocument();
    expect(moreButton()).not.toBeInTheDocument();
    expect(collapsedCells()).toHaveLength(0);
  });

  it('should show less and more when two of three rows are open', async () => {
    await renderGrid({ count: 18, rowCount: 2 });

    expect(lessButton()).toBeInTheDocument();
    expect(moreButton()).toBeInTheDocument();
    expect(collapsedCells()).toHaveLength(6);
  });

  it('should show only more when one of three rows is open', async () => {
    await renderGrid({ count: 18, rowCount: 1 });

    expect(lessButton()).not.toBeInTheDocument();
    expect(moreButton()).toBeInTheDocument();
    expect(collapsedCells()).toHaveLength(12);
  });

  it('should make the collapsed items inert', async () => {
    await renderGrid({ count: 18, rowCount: 2 });

    // jsdom does not reflect the inert property Svelte sets to its attribute.
    const isInert = (id: number) =>
      screen.getByText(`Poster ${id}`).closest<HTMLElement>('.row-reveal-cell')
        ?.inert;

    expect(isInert(12)).toBe(false);
    expect(isInert(13)).toBe(true);
    expect(isInert(18)).toBe(true);
  });

  it('should open a row on more and close one on less', async () => {
    await renderGrid({ count: 18, rowCount: 1 });

    await userEvent.click(screen.getByRole('button', { name: 'more' }));
    expect(collapsedCells()).toHaveLength(6);

    await userEvent.click(screen.getByRole('button', { name: 'more' }));
    expect(collapsedCells()).toHaveLength(0);
    expect(moreButton()).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'less' }));
    expect(collapsedCells()).toHaveLength(6);
  });

  it('should show no more once a short list shows every item', async () => {
    await renderGrid({ count: 8, rowCount: 1 });

    await userEvent.click(screen.getByRole('button', { name: 'more' }));

    expect(collapsedCells()).toHaveLength(0);
    expect(moreButton()).not.toBeInTheDocument();
    expect(lessButton()).toBeInTheDocument();
  });

  it('should show no navigator for a short list that fits one row', async () => {
    await renderGrid({ count: 5, rowCount: 1 });

    expect(lessButton()).not.toBeInTheDocument();
    expect(moreButton()).not.toBeInTheDocument();
  });

  it('should close from the rows the items fill', async () => {
    await renderGrid({ count: 8, rowCount: 3 });

    await userEvent.click(screen.getByRole('button', { name: 'less' }));

    expect(collapsedCells()).toHaveLength(2);
    expect(moreButton()).toBeInTheDocument();
  });

  it('should count the rows in tablet columns on a tablet', async () => {
    setLayout('tablet');
    await renderGrid({ count: 18, rowCount: 2 });

    expect(collapsedCells()).toHaveLength(10);
  });

  it('should keep the desktop count of items on a phone', async () => {
    setLayout('mobile');
    await renderGrid({ count: 18, rowCount: 2 });

    expect(collapsedCells()).toHaveLength(6);
  });

  it('should step a phone row by the phone columns when its rows are phone rows', async () => {
    setLayout('mobile');
    await renderGrid({ count: 18, rowCount: 2, phoneRows: 'mobile' });
    expect(collapsedCells()).toHaveLength(14);

    await userEvent.click(screen.getByRole('button', { name: 'more' }));

    expect(collapsedCells()).toHaveLength(12);
  });

  it('should keep desktop rows above the phone width when its rows are phone rows', async () => {
    await renderGrid({ count: 18, rowCount: 2, phoneRows: 'mobile' });

    expect(collapsedCells()).toHaveLength(6);
  });

  it('should show its own navigator on a phone only when set to mobile', async () => {
    await renderGrid({ count: 18, rowCount: 2, navigator: 'mobile' });
    expect(moreButton()).not.toBeInTheDocument();

    setLayout('mobile');
    await expect(screen.findByRole('button', { name: 'more' })).resolves
      .toBeInTheDocument();
  });

  it.each(['desktop', 'mobile'] as const)(
    'should show no navigator of its own on %s when set to none',
    async (layout) => {
      setLayout(layout);
      await renderGrid({ count: 18, rowCount: 2, navigator: 'none' });
      await tick();

      expect(collapsedCells()).toHaveLength(6);
      expect(document.querySelector('.trakt-load-more')).toBeNull();
    },
  );

  // The poster variant's phone gutter, divider and bottom margin are CSS on it.
  it('should mark a poster grid with its variant', async () => {
    await renderGrid({ count: 6, rowCount: 1, variant: 'posters' });
    const grid = document.querySelector('.trakt-row-reveal-grid');
    expect(grid).toHaveAttribute('data-variant', 'posters');
  });

  // The fanart variant's phone gutter is CSS on it.
  it('should mark a fanart grid with its variant', async () => {
    await renderGrid({ count: 3, rowCount: 1, variant: 'fanart' });
    const grid = document.querySelector('.trakt-row-reveal-grid');
    expect(grid).toHaveAttribute('data-variant', 'fanart');
  });

  // The 20px under a poster grid is CSS keyed on this mark.
  it.each(
    [
      [undefined, 'default'],
      ['default', 'default'],
      ['none', 'none'],
    ] as const,
  )(
    'should mark bottom gap %s on a poster grid as %s',
    async (bottomGap, marked) => {
      await renderGrid({
        count: 6,
        rowCount: 1,
        variant: 'posters',
        bottomGap,
      });
      const grid = document.querySelector('.trakt-row-reveal-grid');
      expect(grid).toHaveAttribute('data-bottom-gap', marked);
    },
  );

  // The 20px above each cell on a phone is CSS keyed on this mark.
  it.each(
    [
      [undefined, 'default'],
      ['default', 'default'],
      ['none', 'none'],
    ] as const,
  )(
    'should mark phone cell gap %s as %s',
    async (phoneCellGap, marked) => {
      await renderGrid({ count: 6, rowCount: 1, phoneCellGap });
      const grid = document.querySelector('.trakt-row-reveal-grid');
      expect(grid).toHaveAttribute('data-phone-cell-gap', marked);
    },
  );

  it('should leave a grid with no variant unmarked', async () => {
    await renderGrid({ count: 6, rowCount: 1 });
    const grid = document.querySelector('.trakt-row-reveal-grid');
    expect(grid).not.toHaveAttribute('data-variant');
    expect(grid).not.toHaveAttribute('data-bottom-gap');
  });

  it('should let a parent with its own navigator step from the open rows', async () => {
    renderComponent(RowRevealGridHost, { props: { count: 8, rowCount: 3 } });

    await userEvent.click(await screen.findByRole('button', { name: 'less' }));

    expect(collapsedCells()).toHaveLength(2);
    expect(moreButton()).toBeInTheDocument();
  });

  it('should report its reveal in the public shape', () => {
    expectTypeOf<ComponentProps<typeof RowRevealGrid>['reveal']>()
      .toEqualTypeOf<RowReveal | undefined>();
  });

  describe('focus', () => {
    it.each(MOVES)(
      'should give the focus back to a moved control, where a move $move',
      async ({ emulate }) => {
        const { update } = await renderFocusGrid({
          ids: [1, 2, 3],
          rowCount: 1,
        });
        emulate();
        button('List 1').focus();

        await update([2, 3, 1]);

        expect(button('List 1')).toHaveFocus();
      },
    );

    // jsdom keeps the focus on a control in a newly inert cell.
    it('should hand the focus on when a refetch pushes its cell into a collapsed row', async () => {
      const ids = Array.from({ length: 18 }, (_, index) => index + 1);
      const { fallback, update } = await renderFocusGrid({ ids, rowCount: 2 });
      button('Watch 12').focus();

      await update([100, ...ids.slice(0, 17)]);

      expect(fallback).toHaveFocus();
    });

    // Two tablet rows of four keep fewer cells open than two desktop rows of six.
    it('should hand the focus on when a resize to tablet width collapses its cell', async () => {
      const ids = Array.from({ length: 18 }, (_, index) => index + 1);
      const { fallback } = await renderFocusGrid({ ids, rowCount: 2 });
      button('Watch 10').focus();

      setLayout('tablet');
      await tick();

      expect(collapsedCells()).toHaveLength(10);
      expect(fallback).toHaveFocus();
    });

    it('should hand the focus on when fewer rows collapse its cell', async () => {
      const ids = Array.from({ length: 18 }, (_, index) => index + 1);
      const { fallback, update } = await renderFocusGrid({ ids, rowCount: 2 });
      button('Watch 10').focus();

      await update(ids, 1);

      expect(fallback).toHaveFocus();
    });

    it.each(REMOVALS)(
      'should hand the focus on when its cell leaves, where removal $removal',
      async ({ emulate }) => {
        const { fallback, update } = await renderFocusGrid({
          ids: [1, 2, 3],
          rowCount: 1,
        });
        emulate();
        button('List 2').focus();

        await update([1, 3]);

        expect(fallback).toHaveFocus();
      },
    );

    it.each(REMOVALS)(
      'should hand the focus on when the grid itself leaves, where removal $removal',
      async ({ emulate }) => {
        const { fallback, unmount } = await renderFocusGrid({
          ids: [1, 2, 3],
          rowCount: 1,
        });
        emulate();
        button('List 2').focus();

        unmount();
        await tick();

        expect(fallback).toHaveFocus();
      },
    );

    it('should hand the focus on when its cell leaves after a Tab within it', async () => {
      const { fallback, update } = await renderFocusGrid({
        ids: [1, 2, 3],
        rowCount: 1,
      });
      button('Watch 2').focus();
      await userEvent.tab();
      expect(button('List 2')).toHaveFocus();

      await update([1, 3]);

      expect(fallback).toHaveFocus();
    });

    it.each([
      { change: 'moves', ids: [2, 3, 1] },
      { change: 'removes', ids: [2, 3] },
    ])(
      'should leave the focus on the page after a blank click when a refetch $change its cell',
      async ({ ids }) => {
        const { update } = await renderFocusGrid({
          ids: [1, 2, 3],
          rowCount: 1,
        });
        button('List 1').focus();
        await userEvent.click(document.body);
        expect(document.body).toHaveFocus();

        await update(ids);

        expect(document.body).toHaveFocus();
      },
    );

    it('should leave the focus on the page after a blank click when an expanded control that opens no menu collapses', async () => {
      const ids = Array.from({ length: 18 }, (_, index) => index + 1);
      const { fallback, update } = await renderFocusGrid({
        ids,
        rowCount: 2,
        item: openDisclosure,
      });
      button('Details 12').focus();
      await userEvent.click(document.body);
      expect(document.body).toHaveFocus();

      await update([100, ...ids.slice(0, 17)]);

      expect(collapsedCells()).toContain(
        button('Details 12').closest('.row-reveal-cell'),
      );
      await waitNegativeClaim();

      expect(document.body).toHaveFocus();
      expect(fallback).not.toHaveFocus();
    });

    it.each([
      { change: 'moves', ids: [2, 3, 1] },
      { change: 'removes', ids: [2, 3] },
    ])(
      'should leave the focus where it moved when a refetch $change its cell',
      async ({ ids }) => {
        const { update } = await renderFocusGrid({
          ids: [1, 2, 3],
          rowCount: 1,
        });
        button('List 1').focus();
        button('Watch 3').focus();

        await update(ids);

        expect(button('Watch 3')).toHaveFocus();
      },
    );

    it.each(REMOVALS)(
      'should hand the focus between the navigator controls at either end, where removal $removal',
      async ({ emulate }) => {
        const ids = Array.from({ length: 18 }, (_, index) => index + 1);
        await renderFocusGrid({ ids, rowCount: 2 });
        emulate();

        button('more').focus();
        await userEvent.keyboard('{Enter}');
        expect(collapsedCells()).toHaveLength(0);
        expect(button('less')).toHaveFocus();

        await userEvent.keyboard('{Enter}');
        await userEvent.keyboard('{Enter}');
        expect(collapsedCells()).toHaveLength(12);
        expect(button('more')).toHaveFocus();
      },
    );

    it.each(REMOVALS)(
      'should hand the focus on when the navigator leaves, where removal $removal',
      async ({ emulate }) => {
        const ids = Array.from({ length: 8 }, (_, index) => index + 1);
        const { fallback, update } = await renderFocusGrid({
          ids,
          rowCount: 1,
        });
        emulate();
        button('more').focus();

        await update(ids.slice(0, 5));

        expect(moreButton()).not.toBeInTheDocument();
        expect(fallback).toHaveFocus();
      },
    );

    // Six items fill one desktop row of six and two tablet rows, four and two.
    it.each(REMOVALS)(
      'should hand the focus on when a resize removes the navigator but keeps every cell open, where removal $removal',
      async ({ emulate }) => {
        setLayout('tablet');
        const ids = Array.from({ length: 6 }, (_, index) => index + 1);
        const { fallback } = await renderFocusGrid({ ids, rowCount: 2 });
        emulate();
        button('less').focus();

        setLayout('desktop');
        await tick();

        expect(lessButton()).not.toBeInTheDocument();
        expect(collapsedCells()).toHaveLength(0);
        expect(fallback).toHaveFocus();
      },
    );

    it('should hand the focus to the section that holds it by default', async () => {
      const section = document.createElement('section');
      document.body.append(section);
      onTestFinished(() => section.remove());
      const props = (ids: number[]) => ({
        items: ids.map((id) => ({ id })),
        key: (poster: Poster) => poster.id,
        columns: { desktop: 6, tablet: 4, mobile: 2 },
        rowMax: 3,
        rowCount: 1,
        item: controls,
      });
      const { rerender } = render(RowRevealGrid<Poster>, {
        props: props([1, 2, 3]),
        target: section,
      });
      button('List 2').focus();

      await rerender(props([1, 3]));
      await tick();

      expect(section).toHaveFocus();
    });

    // A browser blurs the trigger and runs microtasks before it focuses the menu.
    it('should hand the focus on when its cell leaves after focus reached its open menu through the page', async () => {
      const { fallback, update } = await renderMenuGrid({
        ids: [1, 2, 3],
        rowCount: 1,
      });
      button('Menu 2').focus();
      await userEvent.keyboard('{Enter}');
      button('Menu 2').blur();
      expect(document.body).toHaveFocus();
      await Promise.resolve();
      await waitFor(() =>
        expect(screen.getByRole('menuitem', { name: 'Right now 2' }))
          .toHaveFocus()
      );

      await update([1, 3]);

      expect(fallback).toHaveFocus();
    });

    it('should close the open menu of a collapsing cell and hand focus to the fallback', async () => {
      const ids = Array.from({ length: 18 }, (_, index) => index + 1);
      const { fallback, update } = await renderMenuGrid({ ids, rowCount: 2 });
      await openMenuFromKeyboard(button('Menu 12'), 'Right now 12');

      await update([100, ...ids.slice(0, 17)]);

      await waitFor(() => expect(menuOf(12)).not.toBeInTheDocument());
      expect(button('Menu 12')).toHaveAttribute('aria-expanded', 'false');
      expect(fallback).toHaveFocus();
    });

    it('should close a menu opened by touch when its cell collapses', async () => {
      const ids = Array.from({ length: 18 }, (_, index) => index + 1);
      const { fallback, update } = await renderMenuGrid({ ids, rowCount: 2 });
      await openMenuByTouch(button('Menu 12'), 'Menu 12');

      await update([100, ...ids.slice(0, 17)]);

      await waitFor(() => expect(menuOf(12)).not.toBeInTheDocument());
      expect(fallback).toHaveFocus();
    });

    // The menu opens by touch, so the focus goes from the cell straight into it.
    it("should not treat an open menu whose trigger is outside the cell as the cell's menu", async () => {
      const ids = Array.from({ length: 18 }, (_, index) => index + 1);
      const { fallback, update } = await renderFocusGrid({ ids, rowCount: 2 });
      stubClientRects();
      render(MenuHost, { props: { onSelect: vi.fn() } });
      button('Watch 12').focus();
      const menu = await openMenuByTouch(button('Rank'), 'Sort by');

      await update([100, ...ids.slice(0, 17)]);
      expect(collapsedCells()).toContain(
        button('Watch 12').closest('.row-reveal-cell'),
      );
      await waitNegativeClaim();

      expect(menu).toBeInTheDocument();
      expect(menu.contains(document.activeElement)).toBe(true);
      expect(fallback).not.toHaveFocus();
    });
  });
});
