import { goto } from '$app/navigation';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { usePageParam } from '$lib/features/view-params/stores/usePageParam.ts';
import { useViewParam } from '$lib/features/view-params/stores/useViewParam.ts';
import { useDividers } from '$lib/stores/useDividers.ts';
import { HISTORY_EPISODES_URL } from '$mocks/data/users/HISTORY_EPISODES_URL.ts';
import { HISTORY_MOVIES_URL } from '$mocks/data/users/HISTORY_MOVIES_URL.ts';
import { HISTORY_PATH } from '$mocks/data/users/HISTORY_PATH.ts';
import { HISTORY_SEASONS_URL } from '$mocks/data/users/HISTORY_SEASONS_URL.ts';
import { WATCHED_PROGRESS_URL } from '$mocks/data/sync/WATCHED_PROGRESS_URL.ts';
import { HISTORY_SHOWS_URL } from '$mocks/data/users/HISTORY_SHOWS_URL.ts';
import { HISTORY_URL } from '$mocks/data/users/HISTORY_URL.ts';
import { ActivityHistoryResponseMock } from '$mocks/data/users/response/ActivityHistoryResponseMock.ts';
import { MovieActivityHistoryResponseMock } from '$mocks/data/users/response/MovieActivityHistoryResponseMock.ts';
import { SILO_PLAY_RESPONSE } from '$mocks/data/users/SILO_PLAY_RESPONSE.ts';
import { USER_STATS_URL } from '$mocks/data/users/USER_STATS_URL.ts';
import { server } from '$mocks/server.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { REMOVALS } from '$test/beds/focus/REMOVALS.ts';
import { openMenuByClick } from '$test/beds/menus/openMenuByClick.ts';
import { pickMenuRadio } from '$test/beds/menus/pickMenuRadio.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { failOnce } from '$test/beds/request/failOnce.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { holdResponse } from '$test/beds/request/holdResponse.ts';
import { notFound } from '$test/beds/request/notFound.ts';
import { pagedResponse } from '$test/beds/request/pagedResponse.ts';
import { recordSearches } from '$test/beds/request/recordSearches.ts';
import { servePaged } from '$test/beds/request/servePaged.ts';
import { watchedProgressRow } from '$test/beds/request/watchedProgressRow.ts';
import { serveTwoPages } from '$test/beds/request/serveTwoPages.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { followReplaces } from '$test/beds/url/followReplaces.svelte.ts';
import { lastPush } from '$test/beds/url/lastPush.ts';
import { lastReplace } from '$test/beds/url/lastReplace.ts';
import { openAt } from '$test/beds/url/openAt.ts';
import { screen, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import HistoryPage from './HistoryPage.svelte';

type RenderPageParams = { filters?: string; search?: string };

async function renderPage(
  { filters = '', search = '' }: RenderPageParams = {},
) {
  const path = filters === '' ? HISTORY_PATH : `${HISTORY_PATH}/${filters}`;
  openAt(`${path}${search}`);
  const { container, rerender, userLoaded } = renderComponent(HistoryPage, {
    props: { filters },
  });
  await userLoaded;

  return { container, rerender };
}

const cells = (container: HTMLElement) =>
  container.querySelectorAll('.trakt-poster-grid > li');

const stat = (label: string) => screen.getByTitle(label);

const serveItemCount = () =>
  servePaged({
    url: HISTORY_URL,
    body: ActivityHistoryResponseMock,
    itemCount: 729,
  });

const dayDivider = () =>
  screen.findByRole('button', { name: /^Friday 31 January 2025/ });

const dividersToggle = () =>
  screen.getByRole('button', { name: 'Toggle Dividers' });

const SILO_PROGRESS = [
  watchedProgressRow(SILO_PLAY_RESPONSE.show, SILO_PLAY_RESPONSE.watched_at),
];

const serveTwoSiloPlays = () =>
  servePaged({
    url: HISTORY_SHOWS_URL,
    body: [SILO_PLAY_RESPONSE, { ...SILO_PLAY_RESPONSE, id: 3 }],
  });

const EMPTY = "You haven't watched anything yet.";
const EMPTY_RANGE = 'Nothing watched in this range.';
const EMPTY_FILTERED = 'Nothing matches these filters.';

describe('section: HistoryPage', () => {
  describe('rows', () => {
    it('should show a card for each play, with no title bar', async () => {
      const { container } = await renderPage();

      await waitFor(() => expect(cells(container)).toHaveLength(2));
      expect(container.querySelector('.trakt-list-title-bar')).toBeNull();
    });

    it('should draw the first play as the cover, under the History tab', async () => {
      const { container } = await renderPage();

      await waitFor(() =>
        expect(container.querySelector('img[data-position="cover"]'))
          .not.toBeNull()
      );
      expect(screen.getByRole('link', { name: 'History' }))
        .toHaveAttribute('aria-current', 'page');
    });

    it('should draw Pagination over a later page', async () => {
      servePaged({
        url: HISTORY_URL,
        body: ActivityHistoryResponseMock,
        page: 2,
        pageCount: 3,
      });
      await renderPage({ search: '?page=2' });

      expect(await screen.findAllByRole('navigation', { name: /^Pagination/ }))
        .toHaveLength(2);
    });

    it.each(
      [
        { filters: 'shows', search: '?genres=drama', count: 1 },
        { filters: 'episodes', search: '', count: 2 },
      ],
    )(
      'should show $count cards for two plays of one show under $filters$search',
      async ({ filters, search, count }) => {
        serveTwoSiloPlays();
        const { container } = await renderPage({ filters, search });

        await waitFor(() => expect(cells(container)).toHaveLength(count));
      },
    );
  });

  describe('dividers', () => {
    it("should divide the plays by day, with the day's minutes", async () => {
      const { container } = await renderPage();

      expect(await dayDivider()).toHaveTextContent('2h 51m');
      expect(cells(container)).toHaveLength(2);
    });

    it("should keep the day's minutes on Episodes", async () => {
      await renderPage({ filters: 'episodes' });

      expect(await dayDivider()).toHaveTextContent('1h');
    });

    it('should divide Shows by day, with no time spent', async () => {
      servePaged({ url: WATCHED_PROGRESS_URL, body: SILO_PROGRESS });
      await renderPage({ filters: 'shows' });

      expect(await dayDivider())
        .toHaveTextContent(/^Friday 31 January 2025$/);
    });

    it("should hide and show a day's cards from its divider", async () => {
      const { container } = await renderPage();
      const divider = await dayDivider();

      await userEvent.click(divider);

      expect(divider).toHaveAttribute('aria-expanded', 'false');
      expect(cells(container)).toHaveLength(0);

      await userEvent.click(divider);

      expect(divider).toHaveAttribute('aria-expanded', 'true');
      expect(cells(container)).toHaveLength(2);
    });

    it('should run the cards on with no dividers while the toggle is off', async () => {
      const { container } = await renderPage();
      await dayDivider();

      await userEvent.click(dividersToggle());

      await waitFor(() =>
        expect(screen.queryByRole('button', { name: /^Friday/ })).toBeNull()
      );
      expect(cells(container)).toHaveLength(2);

      await userEvent.click(dividersToggle());

      expect(await dayDivider()).toBeInTheDocument();
    });

    it('should open with no dividers when they are stored off', async () => {
      useDividers().setShown(false);
      const { container } = await renderPage();

      await waitFor(() => expect(cells(container)).toHaveLength(2));

      expect(screen.queryByRole('button', { name: /^Friday/ })).toBeNull();
      expect(dividersToggle()).toHaveAttribute('aria-pressed', 'false');
    });

    // Both pages are cached, so the swap to the second never shows a loading state.
    it('should show a hidden day again once the page changes', async () => {
      servePaged({
        url: HISTORY_URL,
        body: ActivityHistoryResponseMock,
        pageCount: 3,
      });
      followReplaces(HISTORY_PATH);
      const { userLoaded } = renderComponent(HistoryPage, {
        props: { filters: '' },
      });
      await userLoaded;
      const { replacePage } = await renderStore(() => usePageParam());
      await dayDivider();
      await replacePage(2);
      await dayDivider();
      await replacePage(1);
      await userEvent.click(await dayDivider());
      expect(await dayDivider()).toHaveAttribute('aria-expanded', 'false');

      await replacePage(2);

      await waitFor(async () =>
        expect(await dayDivider()).toHaveAttribute('aria-expanded', 'true')
      );
    });
  });

  describe('states', () => {
    it('should stay busy, with the toolbar and no copy, while the read loads', async () => {
      const read = holdRequest({ method: 'get', url: HISTORY_URL });
      const { container } = await renderPage();
      await read.requested;

      expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
      expect(stat('Items')).toHaveTextContent(/^Items$/);
      expect(screen.queryByText(EMPTY)).toBeNull();
      expect(cells(container)).toHaveLength(0);
    });

    it('should say nothing was watched when the history is empty', async () => {
      servePaged({ url: HISTORY_URL, body: [] });
      await renderPage();

      expect(await screen.findByText(EMPTY)).toBeInTheDocument();
      expect(screen.queryByText(EMPTY_FILTERED)).toBeNull();
      expect(screen.queryByText(EMPTY_RANGE)).toBeNull();
    });

    it.each(
      [
        { name: 'Movies', filters: 'movies', url: HISTORY_MOVIES_URL },
        { name: 'Shows', filters: 'shows', url: WATCHED_PROGRESS_URL },
        { name: 'Episodes', filters: 'episodes', url: HISTORY_SHOWS_URL },
        { name: 'a genre', search: '?genres=drama', url: HISTORY_URL },
      ],
    )(
      'should give the filtered copy under $name with no plays',
      async ({ filters, search, url }) => {
        servePaged({ url, body: [] });
        await renderPage({ filters, search });

        expect(await screen.findByText(EMPTY_FILTERED)).toBeInTheDocument();
        expect(screen.queryByText(EMPTY)).toBeNull();
        expect(screen.queryByText(EMPTY_RANGE)).toBeNull();
      },
    );

    it.each(
      [
        { name: 'a start', search: '?start_at=2025-01-01', url: HISTORY_URL },
        { name: 'an end', search: '?end_at=2025-01-31', url: HISTORY_URL },
        {
          name: 'a range and a genre',
          search: '?genres=drama&start_at=2025-01-01',
          url: HISTORY_URL,
        },
        {
          name: 'a range and a type',
          filters: 'movies',
          search: '?start_at=2025-01-01',
          url: HISTORY_MOVIES_URL,
        },
      ],
    )(
      'should give the range copy under $name with no plays',
      async ({ filters, search, url }) => {
        servePaged({ url, body: [] });
        await renderPage({ filters, search });

        expect(await screen.findByText(EMPTY_RANGE)).toBeInTheDocument();
        expect(screen.queryByText(EMPTY_FILTERED)).toBeNull();
      },
    );

    it('should show the error box and load the cards on Retry', async () => {
      failOnce(HISTORY_URL);
      const { container } = await renderPage();

      await userEvent.click(
        await screen.findByRole('button', { name: 'Retry' }),
      );

      await waitFor(() => expect(cells(container)).toHaveLength(2));
    });
  });

  describe('stats', () => {
    it("should show the stats' watched figure over the read's count", async () => {
      serveItemCount();
      await renderPage();

      await waitFor(() =>
        expect(stat('Items')).toHaveTextContent(/^5,496 Items$/)
      );
    });

    it.each(
      [
        { name: 'a genre', search: '?genres=drama' },
        { name: 'a date range', search: '?start_at=2025-01-01' },
      ],
    )("should show the read's count under $name", async ({ search }) => {
      serveItemCount();
      await renderPage({ search });

      await waitFor(() =>
        expect(stat('Items')).toHaveTextContent(/^729 Items$/)
      );
      await waitNegativeClaim();

      expect(stat('Items')).toHaveTextContent(/^729 Items$/);
    });

    it("should show the read's count when the stats fail", async () => {
      server.use(http.get(USER_STATS_URL, notFound));
      serveItemCount();
      await renderPage();

      await waitFor(() =>
        expect(stat('Items')).toHaveTextContent(/^729 Items$/)
      );
      await waitNegativeClaim();

      expect(stat('Items')).toHaveTextContent(/^729 Items$/);
    });

    it('should leave the items blank while the read loads, though the stats landed', async () => {
      const read = holdRequest({ method: 'get', url: HISTORY_URL });
      await renderPage();
      await read.requested;

      await waitFor(() =>
        expect(stat('Plays')).toHaveTextContent(/^6,100 Plays$/)
      );

      expect(stat('Items')).toHaveTextContent(/^Items$/);
    });

    it('should keep the pagination on the read, whatever the stats say', async () => {
      servePaged({
        url: HISTORY_URL,
        body: ActivityHistoryResponseMock,
        page: 2,
        pageCount: 3,
        itemCount: 729,
      });
      await renderPage({ search: '?page=2' });

      await waitFor(() =>
        expect(stat('Items')).toHaveTextContent(/^5,496 Items$/)
      );
      expect(screen.getAllByRole('link', { name: '3' })).toHaveLength(2);
      expect(screen.queryByRole('link', { name: '4' })).toBeNull();
    });

    it('should leave the plays out until the stats land', async () => {
      const stats = holdRequest({ method: 'get', url: USER_STATS_URL });
      const { container } = await renderPage();
      await waitFor(() => expect(cells(container)).toHaveLength(2));
      await stats.requested;

      expect(screen.queryByTitle('Plays')).toBeNull();

      stats.release();

      await waitFor(() =>
        expect(stat('Plays')).toHaveTextContent(/^6,100 Plays$/)
      );
    });

    it('should leave the plays out when the stats fail', async () => {
      server.use(http.get(USER_STATS_URL, notFound));
      const { container } = await renderPage();
      await waitFor(() => expect(cells(container)).toHaveLength(2));
      await waitNegativeClaim();

      expect(screen.queryByTitle('Plays')).toBeNull();
    });

    it('should leave the plays out under a genre', async () => {
      const { container } = await renderPage({ search: '?genres=drama' });
      await waitFor(() => expect(cells(container)).toHaveLength(2));
      await waitNegativeClaim();

      expect(screen.queryByTitle('Plays')).toBeNull();
    });
  });

  describe('card art', () => {
    const SILO = { body: [SILO_PLAY_RESPONSE] };
    const HERETIC = { body: MovieActivityHistoryResponseMock };

    const cardArt = (container: HTMLElement) =>
      [...container.querySelectorAll('.trakt-poster-card .trakt-lazy-image')]
        .map((image) => image.getAttribute('data-kind'));

    const onlyGrid = (container: HTMLElement) =>
      assertDefined(
        container.querySelector<HTMLElement>('.trakt-poster-grid'),
        'HistoryPage drew no poster grid',
      );

    it.each(
      [
        {
          view: 'Episodes',
          filters: 'episodes',
          search: '',
          url: HISTORY_SHOWS_URL,
        },
        {
          view: '?episode=',
          filters: '',
          search: '?episode=7',
          url: HISTORY_EPISODES_URL,
        },
        {
          view: '?show=',
          filters: 'episodes',
          search: '?show=12',
          url: HISTORY_SHOWS_URL,
        },
        {
          view: '?season=',
          filters: 'episodes',
          search: '?season=3',
          url: `${HISTORY_SEASONS_URL}/3`,
        },
        {
          view: '?show= on the All path',
          filters: '',
          search: '?show=12',
          url: HISTORY_SHOWS_URL,
        },
      ],
    )(
      'should draw wide cards in 4, 3, 2 and 1 columns on $view, with no phone divider',
      async ({ filters, search, url }) => {
        servePaged({ url, ...SILO });
        const { container } = await renderPage({ filters, search });

        await screen.findByRole('img', { name: 'Silo 1x01 screenshot' });

        const grid = onlyGrid(container);
        expect(cardArt(container)).toEqual(['fanart']);
        expect(screen.getByRole('link', { name: 'Silo' }))
          .toHaveAttribute('href', '/shows/silo');
        expect(grid).toHaveAttribute('data-phone-divider', 'none');
        expect(
          [
            '--poster-grid-columns-desktop',
            '--poster-grid-columns-tablet-lg',
            '--poster-grid-columns-tablet-sm',
            '--poster-grid-columns-mobile',
          ].map((column) => grid.style.getPropertyValue(column)),
        ).toEqual(['4', '3', '2', '1']);
      },
    );

    it.each(
      [
        {
          view: 'All Types',
          filters: '',
          search: '',
          url: HISTORY_URL,
          body: ActivityHistoryResponseMock,
        },
        {
          view: 'Movies',
          filters: 'movies',
          search: '',
          url: HISTORY_MOVIES_URL,
          ...HERETIC,
        },
        {
          view: 'Shows',
          filters: 'shows',
          search: '',
          url: WATCHED_PROGRESS_URL,
          body: SILO_PROGRESS,
        },
        {
          view: '?movie=',
          filters: '',
          search: '?movie=7',
          url: HISTORY_MOVIES_URL,
          ...HERETIC,
        },
        {
          view: '?movie= on the Episodes path',
          filters: 'episodes',
          search: '?movie=7',
          url: HISTORY_MOVIES_URL,
          ...HERETIC,
        },
      ],
    )(
      'should keep posters on $view, in the default columns with the phone divider',
      async ({ filters, search, url, body }) => {
        servePaged({ url, body });
        const { container } = await renderPage({ filters, search });

        await waitFor(() =>
          expect(cardArt(container).length).toBeGreaterThan(0)
        );

        const grid = onlyGrid(container);
        expect(new Set(cardArt(container))).toEqual(new Set(['poster']));
        expect(grid).toHaveAttribute('data-phone-divider', 'default');
        expect(grid.style.getPropertyValue('--poster-grid-columns-desktop'))
          .toBe('');
      },
    );
  });

  describe('item filter', () => {
    const SHOW_ID = 12;
    const SHOW_URL = `${HISTORY_SHOWS_URL.replace('*', '')}/${SHOW_ID}`;

    const typeMenu = () => screen.getByRole('button', { name: /^Type: / });

    it('should narrow the page to the title, name it from the first entry and read the type from the filter', async () => {
      servePaged({ url: SHOW_URL, body: [SILO_PLAY_RESPONSE], itemCount: 25 });
      await renderPage({ filters: 'episodes', search: `?show=${SHOW_ID}` });

      expect(await screen.findByText('Silo', { selector: '.banner-name' }))
        .toBeVisible();
      expect(screen.getByText('Displaying episodes from this show'))
        .toBeVisible();
      expect(typeMenu()).toHaveTextContent('Episodes');
    });

    it("should show the read's count over the stats, and leave the plays out", async () => {
      servePaged({ url: SHOW_URL, body: [SILO_PLAY_RESPONSE], itemCount: 25 });
      await renderPage({ filters: 'episodes', search: `?show=${SHOW_ID}` });

      await waitFor(() => expect(stat('Items')).toHaveTextContent('25'));
      await waitNegativeClaim();
      expect(screen.queryByTitle('Plays')).toBeNull();
    });

    it('should say the generic line and nothing matches on an empty list', async () => {
      servePaged({ url: SHOW_URL, body: [] });
      await renderPage({ filters: 'episodes', search: `?show=${SHOW_ID}` });

      expect(await screen.findByText('Displaying one title')).toBeVisible();
      expect(screen.getByText(EMPTY_FILTERED)).toBeVisible();
    });

    it('should keep the banner over a failed read', async () => {
      server.use(http.get(SHOW_URL, notFound));
      await renderPage({ filters: 'episodes', search: `?show=${SHOW_ID}` });

      expect(await screen.findByRole('button', { name: 'Retry' }))
        .toBeVisible();
      expect(screen.getByText('Displaying episodes from this show'))
        .toBeVisible();
    });

    it('should clear the filter from the X and keep the date range', async () => {
      servePaged({ url: SHOW_URL, body: [SILO_PLAY_RESPONSE] });
      await renderPage({
        filters: 'episodes',
        search: `?show=${SHOW_ID}&start_at=2026-06-07`,
      });

      await userEvent.click(
        await screen.findByRole('button', { name: 'Back to full history' }),
      );

      await waitFor(() =>
        expect(lastReplace()).toBe(
          `${HISTORY_PATH}/episodes?start_at=2026-06-07`,
        )
      );
    });

    it.each(
      [
        {
          title: 'a show',
          filters: 'episodes',
          search: '?show=12',
          type: 'Episodes',
          url: `${HISTORY_PATH}/episodes`,
        },
        {
          title: 'a movie',
          filters: '',
          search: '?movie=7',
          type: 'Movies',
          url: `${HISTORY_PATH}/movies`,
        },
      ],
    )(
      'should clear the filter of $title when its checked type is picked again',
      async ({ filters, search, type, url }) => {
        stubClientRects();
        await renderPage({ filters, search });
        await openMenuByClick(`Type: ${type}`, 'Type');

        await pickMenuRadio(type);

        expect(lastPush()).toBe(url);
      },
    );

    it('should leave the page alone when the checked type is picked again with no filter', async () => {
      stubClientRects();
      await renderPage({ filters: 'episodes' });
      await openMenuByClick('Type: Episodes', 'Type');

      await pickMenuRadio('Episodes');
      await waitNegativeClaim();

      expect(vi.mocked(goto)).not.toHaveBeenCalled();
    });

    describe('the banner across reads', () => {
      const ITEM_ONLY = { values: () => true, fallback: null };
      const bannerName = () =>
        screen.queryByText('Silo', { selector: '.banner-name' });

      const renderFollowed = async () => {
        followReplaces(`${HISTORY_PATH}/episodes`);
        const { set } = await renderStore(() =>
          useViewParam({ show: ITEM_ONLY })
        );
        await set({ show: String(SHOW_ID) });
        const { userLoaded } = renderComponent(HistoryPage, {
          props: { filters: 'episodes' },
        });
        await userLoaded;

        return set;
      };

      it('should keep the title and image while the next page of its title loads', async () => {
        const second = holdResponse(() => HttpResponse.json([]));
        serveTwoPages({
          url: SHOW_URL,
          first: [SILO_PLAY_RESPONSE],
          second: second.answer,
        });
        await renderFollowed();
        expect(await screen.findByText('Silo', { selector: '.banner-name' }))
          .toBeVisible();
        const image = await waitFor(() => {
          const shown = document.querySelector('.banner-image img');
          expect(shown).not.toBeNull();

          return shown;
        });
        const { replacePage } = await renderStore(() => usePageParam());

        await replacePage(2);
        await second.requested;
        await waitNegativeClaim();

        expect(bannerName()).toBeVisible();
        expect(document.querySelector('.banner-image img')).toBe(image);
      });

      it('should drop the title when the filter moves to another title', async () => {
        const OTHER_URL = `${HISTORY_SHOWS_URL.replace('*', '')}/13`;
        servePaged({ url: SHOW_URL, body: [SILO_PLAY_RESPONSE] });
        const other = holdRequest({ method: 'get', url: OTHER_URL });
        const set = await renderFollowed();
        expect(await screen.findByText('Silo', { selector: '.banner-name' }))
          .toBeVisible();

        await set({ show: '13' });
        await other.requested;
        await waitNegativeClaim();

        expect(bannerName()).toBeNull();
      });

      it('should drop the title when the list turns empty', async () => {
        server.use(
          http.get(SHOW_URL, ({ request }) =>
            pagedResponse({
              body: new URL(request.url).searchParams.has('start_at')
                ? []
                : [SILO_PLAY_RESPONSE],
            })),
        );
        await renderFollowed();
        expect(await screen.findByText('Silo', { selector: '.banner-name' }))
          .toBeVisible();
        const range = await renderStore(() =>
          useViewParam({ start_at: ITEM_ONLY })
        );

        await range.set({ start_at: '2026-06-07' });

        expect(await screen.findByText('Displaying one title')).toBeVisible();
        expect(bannerName()).toBeNull();
      });

      const clearButton = () =>
        screen.queryByRole('button', { name: 'Back to full history' });

      it.each(REMOVALS)(
        'should hand the focus of the X to the type menu, where removal $removal',
        async ({ emulate }) => {
          emulate();
          servePaged({ url: SHOW_URL, body: [SILO_PLAY_RESPONSE] });
          await renderFollowed();
          await screen.findByRole('button', { name: 'Back to full history' });

          clearButton()?.focus();
          await userEvent.keyboard('{Enter}');

          await waitFor(() => expect(clearButton()).toBeNull());
          await waitFor(() => expect(document.activeElement).toBe(typeMenu()));
        },
      );

      it('should leave a focus that moved off the X where it is', async () => {
        servePaged({ url: SHOW_URL, body: [SILO_PLAY_RESPONSE] });
        const set = await renderFollowed();
        await screen.findByRole('button', { name: 'Back to full history' });
        clearButton()?.focus();
        dividersToggle().focus();

        await set({ show: null });

        await waitFor(() => expect(clearButton()).toBeNull());
        await waitNegativeClaim();
        expect(document.activeElement).toBe(dividersToggle());
      });
    });

    it('should show no banner with no filter', async () => {
      const { container } = await renderPage();

      await waitFor(() => expect(cells(container)).toHaveLength(2));
      expect(container.querySelector('.trakt-history-item-banner')).toBeNull();
    });
  });

  describe('reads', () => {
    it('should read a new type when the route changes it', async () => {
      const { container, rerender } = await renderPage();
      await waitFor(() => expect(cells(container)).toHaveLength(2));
      await waitFor(() =>
        expect(stat('Plays')).toHaveTextContent(/^6,100 Plays$/)
      );

      await rerender({ filters: 'movies' });

      await waitFor(() => expect(cells(container)).toHaveLength(1));
      expect(screen.getByRole('button', { name: 'Type: Movies' }))
        .toBeInTheDocument();
      expect(stat('Plays')).toHaveTextContent(/^900 Plays$/);
    });

    it('should read a new page when the URL changes it', async () => {
      const searches = recordSearches(HISTORY_URL, ActivityHistoryResponseMock);
      followReplaces(HISTORY_PATH);
      const { userLoaded } = renderComponent(HistoryPage, {
        props: { filters: '' },
      });
      await userLoaded;
      // page.url is shared, so a second instance's write moves the page's read.
      const { replacePage } = await renderStore(() => usePageParam());
      await waitFor(() => expect(searches).toHaveLength(1));

      await replacePage(2);

      await waitFor(() =>
        expect(searches.map((search) => search.get('page')))
          .toEqual(['1', '2'])
      );
    });

    it.each(
      [
        { search: '?genres=drama', param: 'genres', value: 'drama' },
        { search: '?start_at=2025-01-01', param: 'start_at' },
      ],
    )(
      'should carry $param into the read',
      async ({ search, param, value }) => {
        const searches = recordSearches(
          HISTORY_URL,
          ActivityHistoryResponseMock,
        );
        await renderPage({ search });

        await waitFor(() => expect(searches).toHaveLength(1));
        expect(searches.at(0)?.get(param)).toEqual(
          value ?? expect.any(String),
        );
      },
    );

    it('should replace a page past the last with the last page', async () => {
      servePaged({
        url: HISTORY_URL,
        body: ActivityHistoryResponseMock,
        pageCount: 2,
      });
      await renderPage({ search: '?page=5' });

      await waitFor(() => expect(lastReplace()).toBe(`${HISTORY_PATH}?page=2`));
    });
  });
});
