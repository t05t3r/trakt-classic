import { render, screen, within } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import PosterGrid from './PosterGrid.svelte';
import type { PosterGridColumns } from './PosterGridProps.ts';

type Poster = { id: number };

function posters(count: number): Poster[] {
  return Array.from({ length: count }, (_, index) => ({ id: index + 1 }));
}

const item = createRawSnippet((poster: () => Poster) => ({
  render: () => `<span>Poster ${poster().id}</span>`,
}));

const key = (poster: Poster) => poster.id;

function renderGrid(
  props: {
    items?: Poster[];
    phoneDivider?: 'default' | 'none';
    gaps?: 'default' | 'none';
    phoneGaps?: 'default' | 'none';
    tabletLimit?: number;
    columns?: PosterGridColumns;
  } = {},
) {
  const { items = posters(6), ...rest } = props;
  const { container, rerender } = render(PosterGrid<Poster>, {
    props: { items, key, item, ...rest },
  });
  const grid = container.querySelector<HTMLElement>('.trakt-poster-grid');
  const cells = () => [...container.querySelectorAll('.poster-grid-cell')];

  return { grid, cells, rerender };
}

const COLUMN_PROPERTIES = [
  '--poster-grid-columns-desktop',
  '--poster-grid-columns-tablet-lg',
  '--poster-grid-columns-tablet-sm',
  '--poster-grid-columns-mobile',
];

describe('component: PosterGrid', () => {
  it('should list the items, one list item each', () => {
    renderGrid({ items: posters(3) });

    const list = screen.getByRole('list');
    expect(
      within(list).getAllByRole('listitem').map((cell) => cell.textContent),
    )
      .toEqual(['Poster 1', 'Poster 2', 'Poster 3']);
  });

  it('should render a cell for each item, in order', () => {
    const { cells } = renderGrid({ items: posters(3) });

    expect(cells().map((cell) => cell.textContent)).toEqual([
      'Poster 1',
      'Poster 2',
      'Poster 3',
    ]);
  });

  // Safari drops the list role of a list with no markers unless it is explicit.
  it('should keep an explicit list role on the grid', () => {
    renderGrid();

    expect(screen.getByRole('list')).toHaveAttribute('role', 'list');
  });

  it("should keep each item's cell when the items reorder", async () => {
    const items = posters(3);
    const { cells, rerender } = renderGrid({ items });
    const first = screen.getByText('Poster 1').parentElement;

    await rerender({ items: items.toReversed() });

    expect(cells().at(-1)).toBe(first);
  });

  it('should mark the default phone divider and gaps', () => {
    const { grid } = renderGrid();

    expect(grid).toHaveAttribute('data-phone-divider', 'default');
    expect(grid).toHaveAttribute('data-gaps', 'default');
    expect(grid).toHaveAttribute('data-phone-gaps', 'default');
  });

  // The phone divider and the gaps are CSS keyed on these marks.
  it('should mark a grid with no phone divider and no gaps', () => {
    const { grid } = renderGrid({ phoneDivider: 'none', gaps: 'none' });

    expect(grid).toHaveAttribute('data-phone-divider', 'none');
    expect(grid).toHaveAttribute('data-gaps', 'none');
  });

  // Stacking the rows flush on phones is CSS keyed on this mark.
  it('should mark a grid whose rows sit flush on phones', () => {
    const { grid } = renderGrid({ phoneGaps: 'none' });

    expect(grid).toHaveAttribute('data-phone-gaps', 'none');
  });

  // Hiding them on tablets is CSS keyed on this class.
  it('should mark the cells past the tablet limit', () => {
    const { cells } = renderGrid({ tabletLimit: 4 });

    expect(
      cells().map((cell) => cell.classList.contains('is-past-tablet-limit')),
    ).toEqual([false, false, false, false, true, true]);
  });

  it('should mark no cell without a tablet limit', () => {
    const { cells } = renderGrid();

    expect(
      cells().some((cell) => cell.classList.contains('is-past-tablet-limit')),
    ).toBe(false);
  });

  // The column counts are CSS keyed on these properties.
  it("should set the caller's column counts on the grid", () => {
    const { grid } = renderGrid({
      columns: { desktop: 5, tabletLarge: 4, tabletSmall: 3, mobile: 2 },
    });

    expect(
      COLUMN_PROPERTIES.map((name) => grid?.style.getPropertyValue(name)),
    ).toEqual(['5', '4', '3', '2']);
  });

  it('should set no column counts without columns', () => {
    const { grid } = renderGrid();

    expect(
      COLUMN_PROPERTIES.map((name) => grid?.style.getPropertyValue(name)),
    ).toEqual(['', '', '', '']);
  });
});
