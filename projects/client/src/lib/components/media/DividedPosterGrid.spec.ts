import { controlledBy } from '$test/beds/dom/controlledBy.ts';
import DividedPosterGridHost from '$test/beds/media/DividedPosterGridHost.svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import DividedPosterGrid from './DividedPosterGrid.svelte';
import type { DividedPosterGridProps } from './DividedPosterGridProps.ts';

type Play = { id: number; at: Date; runtime: number };

const JULY_11 = 'Saturday 11 July 2026';
const JULY_10 = 'Friday 10 July 2026';

const PLAYS: ReadonlyArray<Play> = [
  { id: 1, at: new Date('2026-07-11T20:00:00.000Z'), runtime: 45 },
  { id: 2, at: new Date('2026-07-11T08:00:00.000Z'), runtime: 103 },
  { id: 3, at: new Date('2026-07-10T08:00:00.000Z'), runtime: 60 },
];

const item = createRawSnippet((play: () => Play) => ({
  render: () => `<span>Play ${play().id}</span>`,
}));

const GRID: DividedPosterGridProps<Play> = {
  items: PLAYS,
  key: ({ id }) => id,
  item,
  dayOf: ({ at }) => at,
  divided: true,
};

function renderGrid(props: Partial<DividedPosterGridProps<Play>> = {}) {
  return render(DividedPosterGrid<Play>, { props: { ...GRID, ...props } });
}

const divider = (name: string | RegExp) => screen.getByRole('button', { name });

const shownPlays = () =>
  screen.queryAllByText(/^Play \d$/).map((play) => play.textContent);

const gridsIn = (container: HTMLElement) =>
  [...container.querySelectorAll('.trakt-poster-grid')].map((grid) =>
    grid.textContent
  );

describe('component: DividedPosterGrid', () => {
  describe('divided', () => {
    it('should give each day a divider, in order', () => {
      renderGrid();

      expect(
        screen.getAllByRole('heading', { level: 2 })
          .map((heading) => heading.textContent),
      ).toEqual([
        expect.stringContaining(JULY_11),
        expect.stringContaining(JULY_10),
      ]);
    });

    // The phone divider's nth-child parity restarts in each grid.
    it("should give each day a grid of that day's items", () => {
      const { container } = renderGrid();

      expect(gridsIn(container)).toEqual([
        expect.stringMatching(/Play 1\s*Play 2/),
        'Play 3',
      ]);
    });

    it("should show each day's minutes when it is given minutesOf", () => {
      renderGrid({ minutesOf: ({ runtime }) => runtime });

      expect(divider(/^Saturday/)).toHaveTextContent('2h 28m');
      expect(divider(/^Friday/)).toHaveTextContent('1h');
    });

    it('should show no time spent without minutesOf', () => {
      renderGrid();

      expect(divider(/^Friday/)).toHaveTextContent(/^Friday 10 July 2026$/);
    });
  });

  describe('not divided', () => {
    it('should run the items on in one grid, with no dividers', () => {
      const { container } = renderGrid({ divided: false });

      expect(screen.queryByRole('heading')).toBeNull();
      expect(gridsIn(container)).toEqual([
        expect.stringMatching(/Play 1\s*Play 2\s*Play 3/),
      ]);
    });
  });

  describe('the grid props', () => {
    const COLUMNS = { desktop: 4, tabletLarge: 3, tabletSmall: 2, mobile: 1 };

    const gridsOf = (container: HTMLElement) => [
      ...container.querySelectorAll<HTMLElement>('.trakt-poster-grid'),
    ];

    it.each([
      { state: 'divided', divided: true, count: 2 },
      { state: 'not divided', divided: false, count: 1 },
    ])(
      'should hand the columns and the phone divider to each grid when $state',
      ({ divided, count }) => {
        const { container } = renderGrid({
          divided,
          columns: COLUMNS,
          phoneDivider: 'none',
        });

        const grids = gridsOf(container);
        expect(grids).toHaveLength(count);
        grids.forEach((grid) => {
          expect(grid).toHaveAttribute('data-phone-divider', 'none');
          expect(grid.style.getPropertyValue('--poster-grid-columns-desktop'))
            .toBe('4');
          expect(grid.style.getPropertyValue('--poster-grid-columns-tablet-lg'))
            .toBe('3');
          expect(grid.style.getPropertyValue('--poster-grid-columns-tablet-sm'))
            .toBe('2');
          expect(grid.style.getPropertyValue('--poster-grid-columns-mobile'))
            .toBe('1');
        });
      },
    );

    it("should leave the grid's defaults without them", () => {
      const { container } = renderGrid();

      gridsOf(container).forEach((grid) => {
        expect(grid).toHaveAttribute('data-phone-divider', 'default');
        expect(grid.style.getPropertyValue('--poster-grid-columns-desktop'))
          .toBe('');
      });
    });
  });

  describe("a day's divider", () => {
    it('should start expanded, controlling an element holding its cards', () => {
      renderGrid();
      const control = divider(/^Saturday/);

      expect(control).toHaveAttribute('aria-expanded', 'true');
      expect(controlledBy(control))
        .toContainElement(screen.getByText('Play 1'));
    });

    it("should hide and show its own day's cards on clicks", async () => {
      renderGrid();
      const control = divider(/^Saturday/);

      await userEvent.click(control);

      expect(control).toHaveAttribute('aria-expanded', 'false');
      expect(divider(/^Friday/)).toHaveAttribute('aria-expanded', 'true');
      expect(shownPlays()).toEqual(['Play 3']);

      await userEvent.click(control);

      expect(control).toHaveAttribute('aria-expanded', 'true');
      expect(shownPlays()).toEqual(['Play 1', 'Play 2', 'Play 3']);
    });

    it('should keep the element it controls, and the class holding its space, while the day is hidden', async () => {
      renderGrid();
      const control = divider(/^Saturday/);

      await userEvent.click(control);

      const wrapper = controlledBy(control);
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toBeEmptyDOMElement();
      expect(wrapper).toHaveClass('day-cards');
    });

    it('should keep the focus on the divider when the keyboard hides its day', async () => {
      renderGrid();
      const control = divider(/^Saturday/);

      control.focus();
      await userEvent.keyboard('{Enter}');

      expect(shownPlays()).toEqual(['Play 3']);
      expect(control).toHaveFocus();
    });

    it("should take the focus when a click that moves none hides the focused card's day", async () => {
      renderGrid({
        item: createRawSnippet((play: () => Play) => ({
          render: () => `<a href="#play">Play ${play().id}</a>`,
        })),
      });
      const control = divider(/^Saturday/);
      screen.getByRole('link', { name: 'Play 1' }).focus();

      await fireEvent.click(control);

      expect(shownPlays()).toEqual(['Play 3']);
      expect(control).toHaveFocus();
    });

    it('should give each day of two grids its own controlled element', () => {
      renderGrid();
      renderGrid();

      const ids = screen.getAllByRole('button')
        .map((control) => control.getAttribute('aria-controls'));

      expect(new Set(ids).size).toBe(4);
    });
  });

  describe('the hidden days', () => {
    it('should stay hidden when the items are read again', async () => {
      const { rerender } = renderGrid();
      await userEvent.click(divider(/^Saturday/));

      await rerender({ items: PLAYS.map((play) => ({ ...play })) });

      expect(divider(/^Saturday/)).toHaveAttribute('aria-expanded', 'false');
      expect(shownPlays()).toEqual(['Play 3']);
    });

    it('should show every card while the dividers are off, and stay hidden when they return', async () => {
      const { rerender } = renderGrid();
      await userEvent.click(divider(/^Saturday/));

      await rerender({ divided: false });

      expect(shownPlays()).toEqual(['Play 1', 'Play 2', 'Play 3']);

      await rerender({ divided: true });

      expect(divider(/^Saturday/)).toHaveAttribute('aria-expanded', 'false');
      expect(shownPlays()).toEqual(['Play 3']);
    });

    it('should reset under a changed key', async () => {
      const { rerender } = render(DividedPosterGridHost<Play>, {
        props: { ...GRID, resetKey: 'page-1' },
      });
      await userEvent.click(divider(/^Saturday/));
      expect(shownPlays()).toEqual(['Play 3']);

      await rerender({ resetKey: 'page-2' });

      expect(divider(/^Saturday/)).toHaveAttribute('aria-expanded', 'true');
      expect(shownPlays()).toEqual(['Play 1', 'Play 2', 'Play 3']);
    });
  });
});
