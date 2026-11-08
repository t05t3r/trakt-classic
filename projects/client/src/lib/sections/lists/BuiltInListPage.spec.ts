import { MAX_PAGE_LIMIT } from '$lib/requests/MAX_PAGE_LIMIT.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { LIST_PAGE_SIZE } from '$lib/utils/LIST_PAGE_SIZE.ts';
import { WatchlistPreviewResponseMock } from '$mocks/data/sync/response/WatchlistPreviewResponseMock.ts';
import { ExtendedUserSettingsMappedMock } from '$mocks/data/users/mapped/ExtendedUserSettingsMappedMock.ts';
import { FAVORITES_PATH } from '$mocks/data/users/FAVORITES_PATH.ts';
import { FavoritedMediaResponseMock } from '$mocks/data/users/response/FavoritedMediaResponseMock.ts';
import { WatchedWatchlistResponseMock } from '$mocks/data/users/response/WatchedWatchlistResponseMock.ts';
import { USER_FAVORITES_URL } from '$mocks/data/users/USER_FAVORITES_URL.ts';
import { USER_WATCHLIST_URL } from '$mocks/data/users/USER_WATCHLIST_URL.ts';
import { WATCHLIST_PATH } from '$mocks/data/users/WATCHLIST_PATH.ts';
import { server } from '$mocks/server.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { controlledBy } from '$test/beds/dom/controlledBy.ts';
import { openMenuByClick } from '$test/beds/menus/openMenuByClick.ts';
import { pickMenuRadio } from '$test/beds/menus/pickMenuRadio.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { holdResponse } from '$test/beds/request/holdResponse.ts';
import { recordSearches } from '$test/beds/request/recordSearches.ts';
import { notFound } from '$test/beds/request/notFound.ts';
import {
  pagedResponse,
  type PagedResponseParams,
} from '$test/beds/request/pagedResponse.ts';
import { servePaged } from '$test/beds/request/servePaged.ts';
import { serveTwoPages } from '$test/beds/request/serveTwoPages.ts';
import { followReplaces } from '$test/beds/url/followReplaces.svelte.ts';
import { lastReplace } from '$test/beds/url/lastReplace.ts';
import { openAt } from '$test/beds/url/openAt.ts';
import { screen, waitFor, within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { http, type PathParams } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import BuiltInListPage from './BuiltInListPage.svelte';

const SLUG = ExtendedUserSettingsMappedMock.slug;

const PATHS = { watchlist: WATCHLIST_PATH, favorites: FAVORITES_PATH } as const;

type RenderPageParams =
  & { list?: keyof typeof PATHS }
  & (
    | { search?: string; follows?: never }
    // page.url then follows each replace the page makes.
    | { search?: never; follows: true }
  );

async function renderPage(
  { list = 'watchlist', search = '', follows }: RenderPageParams = {},
) {
  if (follows) {
    followReplaces(PATHS[list]);
  } else {
    openAt(`${PATHS[list]}${search}`);
  }
  const { container, userLoaded } = renderComponent(BuiltInListPage, {
    props: { list, slug: SLUG },
  });
  await userLoaded;

  return container;
}

function serveFavorites(params: PagedResponseParams) {
  servePaged({ url: USER_FAVORITES_URL, ...params });
}

function serveWatchlist(params: PagedResponseParams) {
  servePaged({ url: USER_WATCHLIST_URL, ...params });
}

// A two-page watchlist whose page 2, for the reads `isHeld` picks by path, waits for release.
function serveHeldSecondPage(
  isHeld: (params: PathParams) => boolean,
  itemCount = LIST_PAGE_SIZE + WatchedWatchlistResponseMock.length,
) {
  const secondPage = () =>
    pagedResponse({
      body: WatchedWatchlistResponseMock,
      page: 2,
      pageCount: 2,
    });
  const held = holdResponse(secondPage);
  serveTwoPages({
    url: USER_WATCHLIST_URL,
    first: WatchlistPreviewResponseMock,
    itemCount,
    second: ({ params }) => isHeld(params) ? held.answer() : secondPage(),
  });

  return held;
}

// Two watched items over the two pages' count.
const SHARE = /^1% Watched 2 \/ 122 items$/;

type PickFromParams = { trigger: string; menu: string; row: string };

async function pickFrom({ trigger, menu, row }: PickFromParams) {
  await openMenuByClick(trigger, menu);
  await pickMenuRadio(row);
}

const cells = (container: HTMLElement) =>
  container.querySelectorAll('.trakt-poster-grid > li');

const stat = (label: string) => screen.getByTitle(label);

describe('section: BuiltInListPage', () => {
  beforeEach(() => {
    stubClientRects();
  });

  describe('favorites', () => {
    it('should show a card for each favourite, under its title bar', async () => {
      const container = await renderPage({ list: 'favorites' });

      await waitFor(() =>
        expect(cells(container)).toHaveLength(FavoritedMediaResponseMock.length)
      );
      expect(screen.getByRole('link', { name: 'Favorites' })).toHaveAttribute(
        'href',
        `/users/${SLUG}/favorites`,
      );
      expect(screen.getByText('My favorite TV shows and movies.'))
        .toBeInTheDocument();
    });

    it("should badge each card with its favourite's rank", async () => {
      const container = await renderPage({ list: 'favorites' });

      await waitFor(() =>
        expect(
          Array.from(
            container.querySelectorAll('.trakt-rank-badge'),
            (badge) => badge.textContent,
          ),
        ).toEqual(['1', '4'])
      );
    });

    it("should set each card's favourite quick-icon on", async () => {
      await renderPage({ list: 'favorites' });

      const icons = await Promise.all(
        ['Heretic', 'Silo'].map((title) =>
          screen.findByRole('button', {
            name: `Remove "${title}" from your Favorites`,
          })
        ),
      );
      icons.forEach((icon) => expect(icon).toHaveClass('is-selected'));
    });

    it('should show the empty text for no favourites', async () => {
      serveFavorites({ body: [] });
      await renderPage({ list: 'favorites' });

      expect(await screen.findByText('You have no favorites yet.'))
        .toBeVisible();
    });

    it("should send the genre menu's pick as the favourites' genres param", async () => {
      const searches = recordSearches(
        USER_FAVORITES_URL,
        FavoritedMediaResponseMock,
      );
      await renderPage({ list: 'favorites', follows: true });

      await pickFrom({
        trigger: 'Genre: All Genres',
        menu: 'Genre',
        row: 'Drama',
      });

      await waitFor(() =>
        expect(searches.map((search) => search.get('genres'))).toContain(
          'drama',
        )
      );
    });

    it('should draw no Pagination, the favourites being one page', async () => {
      serveFavorites({
        body: FavoritedMediaResponseMock,
        pageCount: 3,
        itemCount: 300,
      });
      const container = await renderPage({ list: 'favorites' });

      await waitFor(() =>
        expect(cells(container)).toHaveLength(FavoritedMediaResponseMock.length)
      );
      expect(screen.queryAllByRole('navigation', { name: /^Pagination/ }))
        .toEqual([]);
    });
  });

  describe('watchlist', () => {
    it('should badge no card with a rank and add no favourite icon', async () => {
      const container = await renderPage();

      await screen.findAllByRole('button', { name: /^Mark .* as watched$/ });
      expect(container.querySelector('.trakt-rank-badge')).toBeNull();
      expect(container.querySelector('[data-action="favorite"]')).toBeNull();
    });

    describe('states', () => {
      it('should mark the grid busy while the watchlist loads', async () => {
        const { requested } = holdRequest({
          method: 'get',
          url: USER_WATCHLIST_URL,
        });
        const container = await renderPage();
        await requested;

        expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
      });

      it("should show a card for each of the page's items, under the title bar", async () => {
        const container = await renderPage();

        await waitFor(() =>
          expect(cells(container)).toHaveLength(
            WatchlistPreviewResponseMock.length,
          )
        );
        expect(screen.getByRole('link', { name: 'Watchlist' })).toHaveAttribute(
          'href',
          `/users/${SLUG}/watchlist`,
        );
        expect(
          screen.getByText(
            'Movies, shows, seasons, and episodes I plan to watch.',
          ),
        ).toBeInTheDocument();
      });

      it('should draw the first item as the cover, under the Lists tab', async () => {
        const container = await renderPage();

        await waitFor(() =>
          expect(container.querySelector('img[data-position="cover"]'))
            .not.toBeNull()
        );
        expect(screen.getByRole('link', { current: 'page' }))
          .toHaveTextContent('Lists');
      });

      it('should show the empty text for an empty watchlist', async () => {
        serveWatchlist({ body: [] });
        await renderPage();

        expect(await screen.findByText('Your watchlist is empty.'))
          .toBeVisible();
      });

      it.each([
        ['a type filter', '?display=movie'],
        ['a genre filter', '?genres=drama'],
      ])('should show the filtered empty text under %s', async (_, search) => {
        serveWatchlist({ body: [] });
        await renderPage({ search });

        expect(await screen.findByText('Nothing matches these filters.'))
          .toBeVisible();
      });

      it('should show the filtered empty text once hide-watched removes every card', async () => {
        serveWatchlist({ body: WatchedWatchlistResponseMock });
        await renderPage({ search: '?hide=watched' });

        expect(await screen.findByText('Nothing matches these filters.'))
          .toBeVisible();
        expect(screen.queryByText('Your watchlist is empty.')).toBeNull();
      });

      it('should show the error box and load the cards on Retry when the watchlist fails', async () => {
        server.use(http.get(USER_WATCHLIST_URL, notFound));
        const container = await renderPage();
        const retry = await screen.findByRole('button', { name: 'Retry' });
        expect(screen.getByText("Couldn't load this section.")).toBeVisible();

        serveWatchlist({ body: WatchlistPreviewResponseMock });
        await userEvent.click(retry);

        await waitFor(() =>
          expect(cells(container)).toHaveLength(
            WatchlistPreviewResponseMock.length,
          )
        );
      });
    });

    it('should replace a page past the last with the last page', async () => {
      serveWatchlist({ body: [], page: 5, pageCount: 2, itemCount: 130 });
      await renderPage({ search: '?page=5' });

      await waitFor(() =>
        expect(lastReplace()).toBe(`${WATCHLIST_PATH}?page=2`)
      );
    });

    it("should build no watched read from the previous view's count after a genre pick", async () => {
      const searches: URLSearchParams[] = [];
      const genreCount = holdResponse(() =>
        pagedResponse({ body: WatchlistPreviewResponseMock.slice(0, 2) })
      );
      server.use(
        http.get(USER_WATCHLIST_URL, ({ request }) => {
          const search = new URL(request.url).searchParams;
          searches.push(search);
          if (!search.has('genres')) {
            return pagedResponse({
              body: WatchlistPreviewResponseMock,
              pageCount: 3,
              itemCount: 250,
            });
          }
          if (search.get('limit') === String(MAX_PAGE_LIMIT)) {
            return search.get('page') === '1'
              ? genreCount.answer()
              : pagedResponse({ body: [] });
          }
          return pagedResponse({
            body: WatchlistPreviewResponseMock.slice(0, 2),
            pageCount: 9,
            itemCount: 999,
          });
        }),
      );
      await renderPage({ follows: true });
      await waitFor(() =>
        expect(stat('Items')).toHaveTextContent(/^250 Items$/)
      );

      await pickFrom({
        trigger: 'Genre: All Genres',
        menu: 'Genre',
        row: 'Drama',
      });
      await genreCount.requested;
      await waitNegativeClaim();

      const genrePages = searches
        .filter((search) => search.has('genres'))
        .map((search) => search.get('page'));
      expect(genrePages).not.toContain('2');
    });

    it("should keep the watched share after a sort pick while the new sort's later pages load", async () => {
      const secondPage = serveHeldSecondPage(({ sort_by }) =>
        sort_by === 'title'
      );
      await renderPage({ follows: true });
      await waitFor(() => expect(stat('Watched')).toHaveTextContent(SHARE));

      await pickFrom({
        trigger: 'Sort by: Rank',
        menu: 'Sort by',
        row: 'Title',
      });
      await secondPage.requested;
      await waitNegativeClaim();

      expect(stat('Watched')).toHaveTextContent(SHARE);
    });

    it('should show no watched share after the item count changes while the new count is read', async () => {
      serveHeldSecondPage(() => false);
      await renderPage({ follows: true });
      await waitFor(() => expect(stat('Watched')).toHaveTextContent(SHARE));

      const secondPage = serveHeldSecondPage(
        ({ sort_by }) => sort_by === 'title',
        LIST_PAGE_SIZE + 1,
      );
      await pickFrom({
        trigger: 'Sort by: Rank',
        menu: 'Sort by',
        row: 'Title',
      });
      await secondPage.requested;
      await waitNegativeClaim();

      expect(stat('Items')).toHaveTextContent(/^121 Items$/);
      expect(stat('Watched')).not.toHaveTextContent(/%/);
    });

    it("should show no watched share after a type pick while the new type's later pages load", async () => {
      const secondPage = serveHeldSecondPage(({ type }) => type === 'movies');
      await renderPage({ follows: true });
      await waitFor(() => expect(stat('Watched')).toHaveTextContent(SHARE));

      await pickFrom({
        trigger: 'Type: All Types',
        menu: 'Type',
        row: 'Movies',
      });
      await secondPage.requested;
      await waitNegativeClaim();

      expect(stat('Watched')).not.toHaveTextContent(/%/);
    });

    it("should open the toolbar's options panel on the gear", async () => {
      await renderPage();

      const gear = screen.getByRole('button', { name: 'Options' });
      await userEvent.click(gear);

      const panel = assertDefined(controlledBy(gear));
      expect(panel).toHaveClass('is-open');
      expect(within(panel).getByRole('button', { name: 'Filters' }))
        .toBeInTheDocument();
    });

    it('should close the options panel on a pick and return the focus to the gear', async () => {
      await renderPage();

      const gear = screen.getByRole('button', { name: 'Options' });
      await userEvent.click(gear);
      await pickFrom({
        trigger: 'Sort by: Rank',
        menu: 'Sort by',
        row: 'Title',
      });

      const panel = assertDefined(controlledBy(gear));
      await waitFor(() => expect(gear).toHaveFocus());
      expect(panel).not.toHaveClass('is-open');
    });

    it("should hand the toolbar the page's counts", async () => {
      serveWatchlist({
        body: [
          ...WatchedWatchlistResponseMock,
          assertDefined(WatchlistPreviewResponseMock.at(1)),
        ],
        itemCount: 3,
      });
      await renderPage();

      await waitFor(() => expect(stat('Items')).toHaveTextContent(/^3 Items$/));
      // 111 for Heretic, 52 by 8 episodes for Devs and 127 for Se7en.
      await waitFor(() =>
        expect(stat('Runtime')).toHaveTextContent(/^10h 54m Runtime$/)
      );
      await waitFor(() =>
        expect(stat('Watched')).toHaveTextContent(/^66% Watched 2 \/ 3 items$/)
      );
    });
  });
});
