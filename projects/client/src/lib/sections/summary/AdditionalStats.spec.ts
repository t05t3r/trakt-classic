import { emulateHydrated } from '$test/beds/hydration/emulateHydrated.ts';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import type { StatsRow } from './StatsRow.ts';
import AdditionalStats from './AdditionalStats.svelte';

const WRITERS: StatsRow = {
  key: 'writers',
  label: 'Writers',
  values: [
    {
      key: 'ehren-kruger',
      text: 'Ehren Kruger',
      href: '/people/ehren-kruger',
      alt: '(screenplay)',
    },
    { key: 'eric-singer', text: 'Eric Singer', href: '/people/eric-singer' },
  ],
};

const GENRES: StatsRow = {
  key: 'genres',
  label: 'Genres',
  values: [
    { key: 'action', text: 'Action' },
    { key: 'drama', text: 'Drama' },
  ],
};

const RUNTIME: StatsRow = {
  key: 'runtime',
  label: 'Runtime',
  values: [{ key: 'runtime', minutes: 131 }],
};

const TOTAL_RUNTIME: StatsRow = {
  key: 'total-runtime',
  label: 'Total Runtime',
  values: [{ key: 'total-runtime', minutes: 2047, alt: '(40 episodes)' }],
};

const PREMIERED: StatsRow = {
  key: 'premiered',
  label: 'Premiered',
  values: [{ key: 'premiered', text: '5 May 2023' }],
  zoned: true,
};

function rowText(label: string) {
  return screen.getByText(label).closest('li')?.textContent;
}

describe('AdditionalStats', () => {
  it('should render one row per entry with its label', () => {
    render(AdditionalStats, { props: { rows: [GENRES, RUNTIME] } });

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('Genres')).toBeInTheDocument();
    expect(screen.getByText('Runtime')).toBeInTheDocument();
  });

  // Safari drops the list role of a list with no markers unless it is explicit.
  it('should keep an explicit list role on the rows', () => {
    render(AdditionalStats, { props: { rows: [GENRES, RUNTIME] } });

    expect(screen.getByRole('list')).toHaveAttribute('role', 'list');
  });

  it('should join the values with commas', () => {
    render(AdditionalStats, { props: { rows: [GENRES] } });

    expect(rowText('Genres')).toBe('GenresAction, Drama');
  });

  it('should link a person to their page', () => {
    render(AdditionalStats, { props: { rows: [WRITERS] } });

    expect(screen.getByRole('link', { name: 'Ehren Kruger' }))
      .toHaveAttribute('href', '/people/ehren-kruger');
    expect(screen.getByRole('link', { name: 'Eric Singer' }))
      .toHaveAttribute('href', '/people/eric-singer');
  });

  it("should set a writer's job apart after the name", () => {
    render(AdditionalStats, { props: { rows: [WRITERS] } });

    expect(screen.getByText('(screenplay)')).toHaveClass('stats-alt');
    expect(rowText('Writers')).toBe(
      'WritersEhren Kruger (screenplay), Eric Singer',
    );
  });

  it('should humanize a duration', () => {
    render(AdditionalStats, { props: { rows: [RUNTIME] } });

    expect(rowText('Runtime')).toBe('Runtime2h 11m');
  });

  it('should set the episode count apart after a duration', () => {
    render(AdditionalStats, { props: { rows: [TOTAL_RUNTIME] } });

    expect(screen.getByText('(40 episodes)')).toHaveClass('stats-alt');
    expect(rowText('Total Runtime')).toBe(
      'Total Runtime1d 10h 7m (40 episodes)',
    );
  });

  it('should render nothing without rows', () => {
    const { container } = render(AdditionalStats, { props: { rows: [] } });

    expect(container.querySelector('.trakt-additional-stats')).toBeNull();
  });

  describe('zoned rows', () => {
    it('should leave a zoned row out until the app hydrates', async () => {
      render(AdditionalStats, { props: { rows: [PREMIERED, GENRES] } });

      expect(screen.queryByText('Premiered')).toBeNull();

      emulateHydrated();

      expect(await screen.findByText('Premiered')).toBeInTheDocument();
      expect(rowText('Premiered')).toBe('Premiered5 May 2023');
    });

    it('should render a row with no zone before and after hydration', async () => {
      render(AdditionalStats, { props: { rows: [PREMIERED, GENRES] } });

      expect(rowText('Genres')).toBe('GenresAction, Drama');

      emulateHydrated();
      await screen.findByText('Premiered');

      expect(rowText('Genres')).toBe('GenresAction, Drama');
    });

    it('should render no list while its only rows are zoned', () => {
      const { container } = render(AdditionalStats, {
        props: { rows: [PREMIERED] },
      });

      expect(container.querySelector('.trakt-additional-stats')).toBeNull();
    });
  });
});
