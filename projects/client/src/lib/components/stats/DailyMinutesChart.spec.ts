import { formatLocalDate } from '$lib/utils/date/formatLocalDate.ts';
import { emulateFocusVisible } from '$test/beds/focus/emulateFocusVisible.ts';
import { render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { tick } from 'svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import DailyMinutesChart from './DailyMinutesChart.svelte';
import type { Count } from '$lib/utils/formatting/number/countText.ts';
import type { ChartDay } from './DailyMinutesChartProps.ts';

const NONE: Count = { distinct: 0, plays: 0 };

beforeEach(() => {
  emulateFocusVisible();
});

type ChartDayParams = {
  day: number;
  minutes?: number;
  episodes?: Count;
  movies?: Count;
};

// Days of September 2026 onwards, local time; 37 is October 7.
function chartDay(
  { day, minutes = 0, episodes = NONE, movies = NONE }: ChartDayParams,
): ChartDay {
  const date = new Date(2026, 8, day);
  const key = formatLocalDate(date);

  return {
    key,
    date,
    minutes,
    episodes,
    movies,
    href: `/users/me/history?start_at=${key}&days=1`,
  };
}

// Thirty days from September 8, or from September `start`.
function month(overrides: ReadonlyArray<ChartDayParams> = [], start = 8) {
  return Array.from({ length: 30 }, (_, offset) => {
    const day = start + offset;
    return chartDay(overrides.find((params) => params.day === day) ?? { day });
  });
}

const MONDAY: ChartDayParams = {
  day: 35,
  minutes: 171,
  episodes: { distinct: 2, plays: 3 },
  movies: { distinct: 1, plays: 1 },
};

function renderChart(days: ReadonlyArray<ChartDay>) {
  return render(DailyMinutesChart, { props: { days } });
}

const linkOf = (name: RegExp) => screen.getByRole('link', { name });

// A day's link holds its bar and nothing else.
function barIn(link: HTMLElement): HTMLElement {
  const bar = link.firstElementChild;
  if (!(bar instanceof HTMLElement)) throw new Error('no bar');

  return bar;
}

const barOf = (name: RegExp) => barIn(linkOf(name));

const barHeightIn = (link: HTMLElement) =>
  barIn(link).style.getPropertyValue('--bar-height');

const labelElements = () => screen.queryAllByText(/^\d+$/);

function labelTexts() {
  return labelElements().map((label) => label.textContent);
}

describe('component: DailyMinutesChart', () => {
  it("should link each day to its history, named by the day's tooltip", () => {
    renderChart(month([{
      day: 35,
      minutes: 171,
      episodes: { distinct: 1, plays: 1 },
      movies: { distinct: 1, plays: 1 },
    }]));

    const links = screen.getAllByRole('link');
    const monday = screen.getByRole('link', {
      name: '2h 51m, Monday — October 5, 1 episode, 1 movie',
    });

    expect(links).toHaveLength(30);
    expect(monday).toHaveAttribute(
      'href',
      '/users/me/history?start_at=2026-10-05&days=1',
    );
  });

  it("should scale the bars to the busiest day's minutes rounded up to ten", () => {
    renderChart(month([
      { day: 20, minutes: 171, movies: { distinct: 1, plays: 1 } },
      { day: 21, minutes: 90, movies: { distinct: 1, plays: 1 } },
    ]));

    expect(barHeightIn(linkOf(/September 20/))).toBe('95%');
    expect(barHeightIn(linkOf(/September 21/))).toBe('50%');
    expect(barHeightIn(linkOf(/September 22/))).toBe('0%');
  });

  it('should keep every bar flat when no day has minutes', () => {
    renderChart(month());

    const heights = screen.getAllByRole('link').map(barHeightIn);

    expect(new Set(heights)).toEqual(new Set(['0%']));
  });

  it('should label each bar with its day of the month', () => {
    renderChart(month());

    expect(labelTexts()).toEqual([
      ...Array.from({ length: 23 }, (_, offset) => String(8 + offset)),
      ...Array.from({ length: 7 }, (_, offset) => String(1 + offset)),
    ]);
  });

  it("should mark every other label alternate, counted back from today's", () => {
    renderChart(month());

    const labels = labelElements();
    const alternate = labels.filter((label) =>
      label.classList.contains('is-alternate')
    ).map((label) => label.textContent);

    expect(alternate).toEqual([
      '8',
      '10',
      '12',
      '14',
      '16',
      '18',
      '20',
      '22',
      '24',
      '26',
      '28',
      '30',
      '2',
      '4',
      '6',
    ]);
    expect(labels.at(-1)).toHaveTextContent(/^7$/);
    expect(labels.at(-1)).not.toHaveClass('is-alternate');
    expect(labels).toHaveLength(30);
  });

  describe('tooltip', () => {
    const tooltipOf = (dateLine: string) =>
      screen.queryByText(dateLine)?.closest('[aria-hidden="true"]');

    it("should show the day's minutes, date and counts while a mouse hovers its bar", async () => {
      const user = userEvent.setup();
      renderChart(month([MONDAY]));

      await user.hover(linkOf(/October 5/));
      const tooltip = tooltipOf('Monday — October 5');

      expect(tooltip).toHaveClass('is-visible');
      if (!(tooltip instanceof HTMLElement)) throw new Error('no tooltip');
      expect(within(tooltip).getByText('2h 51m')).toBeInTheDocument();
      expect(within(tooltip).getByText('2 episodes (3 plays)'))
        .toBeInTheDocument();
      expect(within(tooltip).getByText('1 movie')).toBeInTheDocument();
    });

    it("should place the tooltip over the centre of the shown day's column", async () => {
      const user = userEvent.setup();
      renderChart(month([MONDAY]));

      await user.hover(linkOf(/October 5/));
      const x = tooltipOf('Monday — October 5')?.parentElement?.style
        .getPropertyValue('--tooltip-x') ?? '';

      // October 5 is the 28th of 30 columns, so its centre is 27.5 / 30 across.
      expect(x).toMatch(/cqw$/);
      expect(parseFloat(x)).toBeCloseTo((27.5 / 30) * 100);
    });

    it('should fade the tooltip out on its day once the mouse leaves the chart', async () => {
      const user = userEvent.setup();
      renderChart(month([MONDAY]));
      const monday = linkOf(/October 5/);

      await user.hover(monday);
      await user.unhover(monday);
      const tooltip = tooltipOf('Monday — October 5');

      expect(tooltip).toBeInstanceOf(HTMLElement);
      expect(tooltip).not.toHaveClass('is-visible');
      expect(barOf(/October 5/)).not.toHaveClass('is-active');
    });

    it('should show the tooltip while keyboard focus is on its bar, and hide it on blur', async () => {
      const user = userEvent.setup();
      renderChart(month([{ ...MONDAY, day: 8 }]));

      await user.tab();
      expect(linkOf(/September 8/)).toHaveFocus();
      expect(tooltipOf('Tuesday — September 8')).toHaveClass('is-visible');

      await user.tab();
      expect(tooltipOf('Wednesday — September 9')).toHaveClass('is-visible');

      await user.click(document.body);
      expect(tooltipOf('Wednesday — September 9')).not.toHaveClass(
        'is-visible',
      );
    });

    it('should show no tooltip for a bar a click focused, once the mouse leaves the chart', async () => {
      const user = userEvent.setup();
      renderChart(month([MONDAY]));
      const monday = linkOf(/October 5/);

      await user.click(monday);
      expect(monday).toHaveFocus();
      await user.unhover(monday);

      expect(tooltipOf('Monday — October 5')).not.toHaveClass('is-visible');
      expect(barOf(/October 5/)).not.toHaveClass('is-active');
    });

    it("should go back to the focused bar's tooltip once the mouse leaves the chart", async () => {
      const user = userEvent.setup();
      renderChart(month([MONDAY]));
      const monday = linkOf(/October 5/);

      await user.tab();
      await user.hover(monday);
      await user.unhover(monday);

      expect(tooltipOf('Tuesday — September 8')).toHaveClass('is-visible');
      expect(barOf(/September 8/)).toHaveClass('is-active');
    });

    it("should go back to the hovered bar's tooltip once keyboard focus leaves another bar", async () => {
      const user = userEvent.setup();
      renderChart(month([MONDAY]));

      await user.hover(linkOf(/October 5/));
      await user.tab();
      const focused = linkOf(/September 8/);
      expect(focused).toHaveFocus();

      focused.blur();
      await tick();

      expect(tooltipOf('Monday — October 5')).toHaveClass('is-visible');
      expect(barOf(/October 5/)).toHaveClass('is-active');
    });

    it('should keep the tooltip on its day when the days move along', async () => {
      const user = userEvent.setup();
      const { rerender } = renderChart(month([MONDAY]));

      await user.hover(linkOf(/October 5/));
      await rerender({ days: month([MONDAY], 9) });

      expect(tooltipOf('Monday — October 5')).toHaveClass('is-visible');
      expect(barOf(/October 5/)).toHaveClass('is-active');
      expect(barOf(/October 6/)).not.toHaveClass('is-active');
    });

    it('should show no tooltip once its day leaves the chart', async () => {
      const user = userEvent.setup();
      const { rerender } = renderChart(month([{ ...MONDAY, day: 8 }]));

      await user.hover(linkOf(/September 8/));
      await rerender({ days: month([], 9) });

      const highlighted = screen.getAllByRole('link').map(barIn)
        .filter((bar) => bar.classList.contains('is-active'));
      expect(screen.queryByText(/ — /)).toBeNull();
      expect(highlighted).toEqual([]);
    });

    it('should show no tooltip for a touch on a bar', async () => {
      const user = userEvent.setup();
      renderChart(month([MONDAY]));

      await user.pointer({ keys: '[TouchA>]', target: linkOf(/October 5/) });

      expect(tooltipOf('Monday — October 5')).toBeUndefined();
    });

    it('should highlight the bar a mouse hovers or keyboard focus is on, and no other', async () => {
      const user = userEvent.setup();
      renderChart(month([MONDAY]));
      const monday = linkOf(/October 5/);

      await user.hover(monday);
      expect(barOf(/October 5/)).toHaveClass('is-active');
      expect(barOf(/October 4/)).not.toHaveClass('is-active');

      await user.unhover(monday);
      expect(barOf(/October 5/)).not.toHaveClass('is-active');

      await user.tab();
      expect(barOf(/September 8/)).toHaveClass('is-active');
      expect(barOf(/October 5/)).not.toHaveClass('is-active');
    });

    it('should highlight no bar for a touch', async () => {
      const user = userEvent.setup();
      renderChart(month([MONDAY]));

      await user.pointer({ keys: '[TouchA>]', target: linkOf(/October 5/) });

      expect(barOf(/October 5/)).not.toHaveClass('is-active');
    });

    it('should move one tooltip from bar to bar, so it can glide between them', async () => {
      const user = userEvent.setup();
      renderChart(month([MONDAY]));
      const tooltipOf = () =>
        screen.getByText(/ — /).closest('[aria-hidden="true"]');

      await user.hover(linkOf(/October 5/));
      const first = tooltipOf();
      await user.hover(linkOf(/October 6/));

      expect(tooltipOf()).toBe(first);
      expect(first).toHaveTextContent('Tuesday — October 6');
    });

    it('should leave out a count with no plays that day', async () => {
      const user = userEvent.setup();
      renderChart(month([{
        day: 35,
        minutes: 117,
        movies: { distinct: 1, plays: 1 },
      }]));

      await user.hover(linkOf(/October 5/));
      const tooltip = tooltipOf('Monday — October 5');

      expect(tooltip).toHaveTextContent(/^1h 57m Monday — October 5 1 movie$/);
      expect(linkOf(/October 5/)).toHaveAccessibleName(
        '1h 57m, Monday — October 5, 1 movie',
      );
    });
  });
});
