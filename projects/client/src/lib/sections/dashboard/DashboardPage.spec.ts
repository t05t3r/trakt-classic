import { UpNextResponseMock } from '$mocks/data/sync/response/UpNextResponseMock.ts';
import { ActivityHistoryResponseMock } from '$mocks/data/users/response/ActivityHistoryResponseMock.ts';
import { HISTORY_URL } from '$mocks/data/users/HISTORY_URL.ts';
import { WATCHLIST_URL } from '$mocks/data/sync/WATCHLIST_URL.ts';
import { server } from '$mocks/server.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { serveUpNext } from '$test/beds/dashboard/serveUpNext.ts';
import { pagedResponse } from '$test/beds/request/pagedResponse.ts';
import { screen, waitFor, within } from '@testing-library/svelte';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardPage from './DashboardPage.svelte';

const SECTIONS = [
  'hero',
  'up-next',
  'schedule',
  'watchlist',
  'last-30-days',
  'recently-watched',
  'recommendations',
];

// The units that read empty: nothing mocked in their window.
const EMPTY_UNITS = [
  {
    title: 'Upcoming Schedule',
    help: 'All of your shows + movies on your watchlist.',
    empty: 'Nothing airing in the next three weeks.',
  },
  {
    title: 'Last 30 Days',
    help: null,
    empty: 'Nothing watched in the last 30 days.',
  },
];

// The sections whose mocked queries hold items.
const FILLED_SECTIONS = [
  'up-next',
  'watchlist',
  'recently-watched',
  'recommendations',
];

const TITLES = [
  'Up Next',
  'Upcoming Schedule',
  'Watchlist',
  'Last 30 Days',
  'Recently Watched',
  'Show Recommendations',
  'Movie Recommendations',
];

function shells(container: HTMLElement) {
  return [...container.querySelectorAll('.trakt-dashboard-section')];
}

function shell(container: HTMLElement, name: string) {
  const found = shells(container).find((element) =>
    element.getAttribute('data-section') === name
  );
  if (!(found instanceof HTMLElement)) throw new Error(`no ${name} shell`);
  return found;
}

function emptyRegions() {
  return screen.getAllByRole('region').filter((region) =>
    !FILLED_SECTIONS.includes(
      region.closest('[data-section]')?.getAttribute('data-section') ?? '',
    )
  );
}

// The mocked calendar holds no entry in the three weeks from this day, nor the
// mocked history in the 30 days before it.
const NOW = new Date('2026-07-06T12:00:00.000Z');

async function renderPage() {
  const { container, userLoaded } = renderComponent(DashboardPage, {
    props: {},
  });
  await userLoaded;
  const schedule = await screen.findByRole('region', {
    name: 'Upcoming Schedule',
  });
  await within(schedule).findByText('Nothing airing in the next three weeks.');
  const last30Days = screen.getByRole('region', { name: 'Last 30 Days' });
  await within(last30Days).findByText('Nothing watched in the last 30 days.');

  return container;
}

describe('section: DashboardPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should stack the seven sections in order', async () => {
    const container = await renderPage();

    expect(
      shells(container).map((element) => element.getAttribute('data-section')),
    ).toEqual(SECTIONS);
  });

  it("should greet the user in the hero as the page's only h1", async () => {
    const container = await renderPage();

    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings.at(0)).toHaveTextContent(/^Hello, Harry Du Bois$/);
    expect(within(shell(container, 'hero')).getByRole('heading', { level: 1 }))
      .toBe(headings.at(0));
  });

  it('should hold no section in the hero frame', async () => {
    const container = await renderPage();

    expect(within(shell(container, 'hero')).queryByRole('region')).toBeNull();
  });

  it('should render Up Next from its query in its shell', async () => {
    const container = await renderPage();

    const upNext = within(shell(container, 'up-next'))
      .getByRole('region', { name: 'Up Next' });
    expect(
      await within(upNext).findByRole('link', { name: '1x01 Freedom Day' }),
    )
      .toBeVisible();
  });

  it('should render the Watchlist from its query in its shell', async () => {
    const container = await renderPage();

    const watchlist = within(shell(container, 'watchlist'))
      .getByRole('region', { name: 'Watchlist' });
    expect(
      await within(watchlist).findByRole('link', { name: 'Season 3' }),
    ).toBeVisible();
  });

  it('should render Recently Watched from its query in its shell', async () => {
    const container = await renderPage();

    const recentlyWatched = within(shell(container, 'recently-watched'))
      .getByRole('region', { name: 'Recently Watched' });
    expect(
      await within(recentlyWatched).findByRole('link', {
        name: '1x01 Freedom Day',
      }),
    ).toBeVisible();
  });

  it('should render Last 30 Days from its query in its shell', async () => {
    server.use(
      http.get(HISTORY_URL, () =>
        pagedResponse({
          body: ActivityHistoryResponseMock.map((play) => ({
            ...play,
            watched_at: '2026-07-05T20:00:00.000Z',
          })),
        })),
    );
    const { container } = renderComponent(DashboardPage, { props: {} });

    const last30Days = await screen.findByRole('region', {
      name: 'Last 30 Days',
    });
    expect(shell(container, 'last-30-days')).toContainElement(last30Days);
    expect(
      await within(last30Days).findByRole('link', { name: 'Drama: 1 episode' }),
    ).toBeVisible();
  });

  it('should render each other section titled, in order, with its empty box', async () => {
    await renderPage();

    const regions = emptyRegions();
    expect(regions.map((region) => region.getAttribute('aria-busy')))
      .toEqual(EMPTY_UNITS.map(() => 'false'));
    expect(
      regions.map((region) => ({
        title: within(region).getByRole('heading', { level: 2 }).textContent
          ?.trim(),
        help: region.querySelector('.help-text')?.textContent?.trim() ?? null,
        empty: region.querySelector('.trakt-empty-state')?.textContent?.trim(),
      })),
    ).toEqual(EMPTY_UNITS);
  });

  it('should label each section by its title', async () => {
    await renderPage();

    TITLES.forEach((title) =>
      expect(screen.getByRole('region', { name: title })).toBeVisible()
    );
  });

  it('should give only Recently Watched the wide header spacing', async () => {
    await renderPage();

    expect(
      screen.getAllByRole('region').map((region) =>
        region.querySelector('.trakt-section-header')?.getAttribute(
          'data-spacing',
        )
      ),
    ).toEqual(
      TITLES.map((title) => title === 'Recently Watched' ? 'wide' : 'default'),
    );
  });

  it('should hold both recommendation sections in one shell', async () => {
    const container = await renderPage();

    const recommendations = shell(container, 'recommendations');
    expect(
      within(recommendations).getAllByRole('region').map((region) =>
        within(region).getByRole('heading', { level: 2 }).textContent?.trim()
      ),
    ).toEqual(['Show Recommendations', 'Movie Recommendations']);
  });

  it("should render the schedule's dates from the calendar", async () => {
    vi.setSystemTime(new Date('2023-05-04T12:00:00.000Z'));
    renderComponent(DashboardPage, { props: {} });

    const schedule = await screen.findByRole('region', {
      name: 'Upcoming Schedule',
    });
    expect(
      await within(schedule).findByRole('heading', { level: 3 }),
    ).toHaveTextContent('Friday 5 May');
  });

  it("should draw the hero's poster wall from Up Next's one request", async () => {
    const calls = { count: 0 };
    serveUpNext(() => {
      calls.count += 1;
      return HttpResponse.json(UpNextResponseMock);
    });
    const container = await renderPage();

    const hero = shell(container, 'hero');
    await waitFor(() =>
      expect(hero.querySelectorAll('.trakt-poster-wall image')).toHaveLength(24)
    );
    await within(screen.getByRole('region', { name: 'Up Next' }))
      .findByRole('link', { name: '1x01 Freedom Day' });
    expect(calls.count).toBe(1);
  });

  it('should leave the hero without a poster wall when Up Next and the Watchlist are empty', async () => {
    serveUpNext(() => new HttpResponse(null, { status: 204 }));
    server.use(http.get(WATCHLIST_URL, () => HttpResponse.json([])));
    const container = await renderPage();

    const upNext = screen.getByRole('region', { name: 'Up Next' });
    await within(upNext).findByText(
      'Nothing up next. Start watching a show and it will appear here.',
    );
    expect(shell(container, 'hero').querySelector('.trakt-poster-wall'))
      .toBeNull();
  });
});
