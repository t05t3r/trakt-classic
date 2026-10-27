import { render, screen, within } from '@testing-library/svelte';
import { nextFrame } from '$test/beds/promise/nextFrame.ts';
import { stubRowLayout } from '$test/beds/layout/stubRowLayout.ts';
import { describe, expect, it } from 'vitest';
import SeasonSwitcher from './SeasonSwitcher.svelte';
import type { SwitcherEntry } from './SeasonSwitcherProps.ts';

const ENTRIES: ReadonlyArray<SwitcherEntry> = [
  { label: '2', href: '/shows/silo/seasons/2', isCurrent: false },
  { label: '1', href: '/shows/silo/seasons/1', isCurrent: true },
  {
    label: 'Specials',
    href: '/shows/silo/seasons/0',
    isCurrent: false,
  },
];

function strip() {
  return screen.getByRole('navigation', { name: 'Season' });
}

const ENTRY_WIDTH = 40;
const STRIP_WIDTH = 100;

const layOutStrip = () =>
  stubRowLayout({ itemWidth: ENTRY_WIDTH, viewWidth: STRIP_WIDTH });

const episodes = (
  current: number,
  season = 1,
): ReadonlyArray<SwitcherEntry> =>
  Array.from({ length: 10 }, (_, index) => ({
    label: `${index + 1}`,
    href: `/shows/silo/seasons/${season}/episodes/${index + 1}`,
    isCurrent: index + 1 === current,
  }));

// Which element the last scroll moved, and whether it left the entry whole in view.
function lastScroll(
  scrollTo: ReturnType<typeof stubRowLayout>,
  entry: HTMLElement,
) {
  const left: number = scrollTo.mock.calls.at(-1)?.at(0)?.left ?? 0;
  const entryLeft = entry.offsetLeft;

  return {
    scrolled: scrollTo.mock.contexts.at(-1),
    inView: left <= entryLeft && entryLeft + ENTRY_WIDTH <= left + STRIP_WIDTH,
  };
}

describe('component: SeasonSwitcher', () => {
  it('should name the strip by its label', () => {
    render(SeasonSwitcher, { props: { label: 'Season', entries: ENTRIES } });

    expect(strip()).toHaveTextContent(/^Season/);
  });

  it('should link each entry under its label, in order', () => {
    render(SeasonSwitcher, { props: { label: 'Season', entries: ENTRIES } });

    const links = within(strip()).getAllByRole('link');
    expect(links.map((link) => link.textContent?.trim())).toEqual([
      '2',
      '1',
      'Specials',
    ]);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/shows/silo/seasons/2',
      '/shows/silo/seasons/1',
      '/shows/silo/seasons/0',
    ]);
  });

  it('should mark the current entry alone as the current page', () => {
    render(SeasonSwitcher, { props: { label: 'Season', entries: ENTRIES } });

    const links = within(strip()).getAllByRole('link');
    expect(links.map((link) => link.getAttribute('aria-current'))).toEqual([
      null,
      'page',
      null,
    ]);
  });

  it('should keep an explicit list role on the entries', () => {
    render(SeasonSwitcher, { props: { label: 'Season', entries: ENTRIES } });

    expect(within(strip()).getByRole('list')).toHaveAttribute('role', 'list');
  });

  it('should scroll the strip to bring the current entry into view', async () => {
    const scrollTo = layOutStrip();
    render(SeasonSwitcher, {
      props: { label: 'Season', entries: episodes(8) },
    });
    await nextFrame();

    const list = within(strip()).getByRole('list');
    const current = within(list).getByRole('link', { current: 'page' });
    expect(lastScroll(scrollTo, current.parentElement ?? current)).toEqual({
      scrolled: list,
      inView: true,
    });
  });

  it('should scroll the strip again when another entry becomes the current one', async () => {
    const scrollTo = layOutStrip();
    const { rerender } = render(SeasonSwitcher, {
      props: { label: 'Season', entries: episodes(8) },
    });
    await nextFrame();

    await rerender({ label: 'Season', entries: episodes(1) });
    await nextFrame();

    const list = within(strip()).getByRole('list');
    const current = within(list).getByRole('link', { current: 'page' });
    expect(current).toHaveTextContent('1');
    expect(lastScroll(scrollTo, current.parentElement ?? current)).toEqual({
      scrolled: list,
      inView: true,
    });
  });

  it("should scroll the strip again each time another season's list keeps the same number current", async () => {
    const scrollTo = layOutStrip();
    const { rerender } = render(SeasonSwitcher, {
      props: { label: 'Season', entries: episodes(8) },
    });
    await nextFrame();
    await rerender({ label: 'Season', entries: episodes(8, 2) });
    await nextFrame();
    // The reader scrolls the strip back to its start.
    const list = within(strip()).getByRole('list');
    list.scrollLeft = 0;
    scrollTo.mockClear();

    await rerender({ label: 'Season', entries: episodes(8, 3) });
    await nextFrame();

    const current = within(list).getByRole('link', { current: 'page' });
    expect(current).toHaveAttribute('href', '/shows/silo/seasons/3/episodes/8');
    expect(lastScroll(scrollTo, current.parentElement ?? current)).toEqual({
      scrolled: list,
      inView: true,
    });
  });

  it('should show its label with no entries while they load', () => {
    render(SeasonSwitcher, { props: { label: 'Episode', entries: [] } });

    const loading = screen.getByRole('navigation', { name: 'Episode' });
    expect(loading).toHaveTextContent(/^Episode$/);
    expect(within(loading).queryAllByRole('link')).toHaveLength(0);
  });
});
