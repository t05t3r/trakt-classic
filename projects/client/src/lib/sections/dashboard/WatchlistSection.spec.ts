import { WELL_KNOWN_MEDIA_QUERY } from '$lib/stores/css/WELL_KNOWN_MEDIA_QUERY.ts';
import { useRowCount } from '$lib/stores/useRowCount.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { safeLocalStorage } from '$lib/utils/storage/safeLocalStorage.ts';
import { WatchlistPreviewResponseMock } from '$mocks/data/sync/response/WatchlistPreviewResponseMock.ts';
import { SYNC_WATCHLIST_REMOVE_URL } from '$mocks/data/sync/SYNC_WATCHLIST_REMOVE_URL.ts';
import { WATCHLIST_URL } from '$mocks/data/sync/WATCHLIST_URL.ts';
import { EarlyRatingsUserSettingsResponseMock } from '$mocks/data/users/response/EarlyRatingsUserSettingsResponseMock.ts';
import { USER_SETTINGS_URL } from '$mocks/data/users/USER_SETTINGS_URL.ts';
import { server } from '$mocks/server.ts';
import { fakeLayouts } from '$test/beds/css/fakeLayouts.ts';
import { cards } from '$test/beds/dashboard/cards.ts';
import { readyCards } from '$test/beds/dashboard/readyCards.ts';
import { renderSection } from '$test/beds/dashboard/renderSection.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { collapsedCells } from '$test/beds/pagination/collapsedCells.ts';
import { holdResponse } from '$test/beds/request/holdResponse.ts';
import { notFound } from '$test/beds/request/notFound.ts';
import { pagedResponse } from '$test/beds/request/pagedResponse.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { cleanup, screen, waitFor, within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import WatchlistSection from './WatchlistSection.svelte';

// The list icon renders only once a layout matches.
const setLayout = fakeLayouts({ desktop: WELL_KNOWN_MEDIA_QUERY.desktop });

type WatchlistResponse = typeof WatchlistPreviewResponseMock;

const BATMAN = assertDefined(WatchlistPreviewResponseMock.at(0));

const UNRELEASED_BATMAN_LIST: WatchlistResponse = [BATMAN].map((item) =>
  item.movie
    ? { ...item, movie: { ...item.movie, released: '2999-01-01' } }
    : item
);

// Eighteen copies of the first movie fill the three desktop rows of six.
const EIGHTEEN_ITEMS: WatchlistResponse = Array.from(
  { length: 18 },
  (_, index) => ({ ...BATMAN, id: index + 1, rank: index + 1 }),
);

// One route serves the strip's preview and the ids-only watchlist Snapshot.
function serve(
  answer: () => Response | Promise<Response>,
  snapshot: () => WatchlistResponse = () => [],
) {
  server.use(
    http.get(WATCHLIST_URL, ({ request }) => {
      const extended = new URL(request.url).searchParams.get('extended');
      if (extended === 'full,images') return answer();
      return pagedResponse({ body: snapshot() });
    }),
  );
}

const SECTION = { component: WatchlistSection, name: 'Watchlist' };

const CARD_SELECTOR = '.trakt-poster-card';

// The fixture's movie, movie, show, show, season and episode cards.
async function readyFixtureCards() {
  const region = await renderSection(SECTION);
  const [movie, , show, , season, episode] = await readyCards({
    region,
    selector: CARD_SELECTOR,
    count: 6,
  });
  if (!movie || !show || !season || !episode) throw new Error('no cards');

  return { region, movie, show, season, episode };
}

function seeMore(region: HTMLElement) {
  return within(region).getByRole('link', { name: /on your watchlist$/ });
}

function subtitleLines(card: HTMLElement) {
  return [...card.querySelectorAll('.card-subtitle')].map((line) =>
    line.textContent
  );
}

describe('section: WatchlistSection', () => {
  beforeEach(() => setLayout('desktop'));

  describe('header', () => {
    it('should hold the header with its spinner, help line and no body while loading', async () => {
      serve(holdResponse(() => pagedResponse({ body: [] })).answer);

      const region = await renderSection(SECTION);

      const heading = within(region).getByRole('heading', { level: 2 });
      expect(region).toHaveAttribute('aria-busy', 'true');
      expect(heading).toHaveTextContent('Watchlist');
      expect(heading.querySelector('.section-title-spinner')).not.toBeNull();
      expect(region.querySelector('.help-text'))
        .toHaveTextContent('Sorted by Rank');
      expect(region.querySelector('.trakt-empty-state')).toBeNull();
      expect(cards(region, CARD_SELECTOR)).toEqual([]);
    });

    it('should end the help line with the down arrow', async () => {
      const region = await renderSection(SECTION);

      const arrow = region.querySelector('.help-text svg');
      expect(arrow).toHaveClass('tabler-icon-arrow-down');
      expect(arrow).toHaveAttribute('aria-hidden', 'true');
    });

    it('should drop the gap under its help text', async () => {
      const region = await renderSection(SECTION);

      expect(region.querySelector('.trakt-section-header'))
        .toHaveAttribute('data-help-text-gap', 'none');
    });

    it('should link the see-more to the watchlist page, its label and name holding the item count', async () => {
      serve(() =>
        pagedResponse({ body: WatchlistPreviewResponseMock, itemCount: 69 })
      );

      const region = await renderSection(SECTION);
      await readyCards({ region, selector: CARD_SELECTOR, count: 6 });

      expect(seeMore(region)).toHaveAttribute('href', '/users/me/watchlist');
      expect(seeMore(region)).toHaveTextContent('All 69 items');
      expect(seeMore(region))
        .toHaveAccessibleName('All 69 items on your watchlist');
    });

    it("should group the thousands of the see-more's count in its label and name", async () => {
      serve(() =>
        pagedResponse({ body: WatchlistPreviewResponseMock, itemCount: 1234 })
      );

      const region = await renderSection(SECTION);
      await readyCards({ region, selector: CARD_SELECTOR, count: 6 });

      expect(seeMore(region)).toHaveTextContent('All 1,234 items');
      expect(seeMore(region))
        .toHaveAccessibleName('All 1,234 items on your watchlist');
    });

    it('should label and name the see-more without a count while loading', async () => {
      serve(holdResponse(() => pagedResponse({ body: [] })).answer);

      const region = await renderSection(SECTION);

      expect(seeMore(region)).toHaveAttribute('href', '/users/me/watchlist');
      expect(seeMore(region)).toHaveTextContent('All items');
      expect(seeMore(region))
        .toHaveAccessibleName('All items on your watchlist');
    });

    it('should label the see-more without a count when the answer carries none', async () => {
      serve(() => pagedResponse({ body: WatchlistPreviewResponseMock }));

      const region = await renderSection(SECTION);
      await readyCards({ region, selector: CARD_SELECTOR, count: 6 });

      expect(seeMore(region)).toHaveTextContent('All items');
    });
  });

  describe('states', () => {
    it('should show the empty box, keeping the see-more with its count of 0, for an empty watchlist', async () => {
      serve(() => pagedResponse({ body: [], itemCount: 0 }));

      const region = await renderSection(SECTION);

      expect(await within(region).findByText('Your watchlist is empty.'))
        .toBeVisible();
      expect(region).toHaveAttribute('aria-busy', 'false');
      expect(seeMore(region)).toHaveAttribute('href', '/users/me/watchlist');
      expect(seeMore(region)).toHaveTextContent('All 0 items');
      expect(seeMore(region))
        .toHaveAccessibleName('All 0 items on your watchlist');
    });

    it('should show the error box, the see-more without a count, and load the cards on Retry', async () => {
      serve(notFound);
      const region = await renderSection(SECTION);
      const retry = await within(region).findByRole('button', {
        name: 'Retry',
      });
      expect(region).toHaveTextContent("Couldn't load this section.");
      expect(seeMore(region)).toHaveTextContent('All items');

      serve(() =>
        pagedResponse({ body: WatchlistPreviewResponseMock, itemCount: 69 })
      );
      await userEvent.click(retry);

      await readyCards({ region, selector: CARD_SELECTOR, count: 6 });
      expect(seeMore(region)).toHaveTextContent('All 69 items');
    });
  });

  describe('cards', () => {
    it('should render one card per item, in rank order', async () => {
      const region = await renderSection(SECTION);

      expect(
        (await readyCards({ region, selector: CARD_SELECTOR, count: 6 })).map((
          card,
        ) => card.querySelector('h3')?.textContent?.trim()),
      ).toEqual([
        'The Batman',
        'Se7en',
        'Slow Horses',
        'Shōgun',
        'Season 3',
        '1x01 The Heirs of the Dragon',
      ]);
      expect(region).toHaveAttribute('aria-busy', 'false');
    });

    it('should link each card to its own page', async () => {
      const { movie, show, season, episode } = await readyFixtureCards();

      expect(
        [movie, show, season, episode].map((card) =>
          card.querySelector('a.poster')?.getAttribute('href')
        ),
      ).toEqual([
        '/movies/the-batman-2022',
        '/shows/slow-horses',
        '/shows/silo/seasons/3',
        '/shows/house-of-the-dragon/seasons/1/episodes/1',
      ]);
    });

    it('should give a movie or show card two empty lines', async () => {
      const { movie, show } = await readyFixtureCards();

      expect(subtitleLines(movie)).toEqual(['\u00a0', '\u00a0']);
      expect(subtitleLines(show)).toEqual(['\u00a0', '\u00a0']);
    });

    it('should give a season or episode card its show link on the first line, the second empty', async () => {
      const { season, episode } = await readyFixtureCards();

      expect(subtitleLines(season)).toEqual(['Silo', '\u00a0']);
      expect(within(season).getByRole('link', { name: 'Silo' }))
        .toHaveAttribute('href', '/shows/silo');
      expect(subtitleLines(episode)).toEqual(['House of the Dragon', '\u00a0']);
      expect(within(episode).getByRole('link', { name: 'House of the Dragon' }))
        .toHaveAttribute('href', '/shows/house-of-the-dragon');
    });

    it("should show a season's own poster and an episode's show poster", async () => {
      const { season, episode } = await readyFixtureCards();

      expect(within(season).getByRole('img', { name: '"Silo" poster' }))
        .toHaveAttribute(
          'src',
          '/img/seasons/000/456/019/posters/thumb/279e86a7d7.jpg.webp',
        );
      expect(
        within(episode).getByRole('img', {
          name: '"House of the Dragon" poster',
        }),
      ).toHaveAttribute(
        'src',
        '/img/shows/000/154/574/posters/thumb/5fea83a517.jpg.webp',
      );
    });

    it('should mark an episode card with its type ribbon, and no other card', async () => {
      const { region, episode } = await readyFixtureCards();

      expect(region.querySelectorAll('.trakt-episode-type-ribbon'))
        .toHaveLength(1);
      expect(episode.querySelector('.trakt-episode-type-ribbon'))
        .toHaveTextContent('Series Premiere');
    });

    it('should give a movie card the smaller watch and list icons and the community rating', async () => {
      const { movie } = await readyFixtureCards();

      const icons = await waitFor(() => {
        const found = [...movie.querySelectorAll('.trakt-quick-icon')];
        expect(found).toHaveLength(2);
        return found;
      });

      expect(icons.map((icon) => icon.getAttribute('aria-label'))).toEqual([
        'Mark "The Batman" as watched',
        'Add or remove "The Batman" from lists',
      ]);
      expect(movie.querySelector('.trakt-quick-actions'))
        .toHaveAttribute('data-size', 'smaller');
      expect(movie.querySelector('.trakt-community-rating'))
        .toHaveTextContent('80%');
      expect(movie.querySelector('.trakt-community-rating'))
        .toHaveAttribute('data-variant', 'smaller');
    });

    it('should select the list icon of an item on the watchlist', async () => {
      serve(
        () =>
          pagedResponse({ body: WatchlistPreviewResponseMock, itemCount: 69 }),
        () => [BATMAN],
      );
      const { movie } = await readyFixtureCards();

      await waitFor(() =>
        expect(
          within(movie).getByRole('button', {
            name: 'Add or remove "The Batman" from lists',
          }),
        ).toHaveClass('is-selected')
      );
    });

    it('should give a season card the smaller watch and list icons, named after the season and its show, and the community rating', async () => {
      const { season } = await readyFixtureCards();

      const icons = await waitFor(() => {
        const found = [...season.querySelectorAll('.trakt-quick-icon')];
        expect(found).toHaveLength(2);
        return found;
      });

      expect(icons.map((icon) => icon.getAttribute('aria-label'))).toEqual([
        'Mark "Season 3 of Silo" as watched',
        'Add or remove "Season 3 of Silo" from lists',
      ]);
      expect(season.querySelector('.trakt-quick-actions'))
        .toHaveAttribute('data-size', 'smaller');
      expect(season.querySelector('.trakt-community-rating'))
        .toHaveTextContent('82%');
      expect(season.querySelector('.trakt-community-rating'))
        .toHaveAttribute('data-variant', 'smaller');
    });

    it('should hide the community rating of an unreleased movie', async () => {
      serve(() => pagedResponse({ body: UNRELEASED_BATMAN_LIST }));
      const region = await renderSection(SECTION);
      const [movie] = await readyCards({
        region,
        selector: CARD_SELECTOR,
        count: 1,
      });
      if (!movie) throw new Error('no card');

      await within(movie).findByRole('button', {
        name: 'Add or remove "The Batman" from lists',
      });

      expect(movie.querySelector('.trakt-community-rating')).toBeNull();
    });

    it('should show the community rating of an unreleased movie to a user who displays early ratings', async () => {
      server.use(
        http.get(
          USER_SETTINGS_URL,
          () => HttpResponse.json(EarlyRatingsUserSettingsResponseMock),
        ),
      );
      serve(() => pagedResponse({ body: UNRELEASED_BATMAN_LIST }));
      const region = await renderSection(SECTION);
      const [movie] = await readyCards({
        region,
        selector: CARD_SELECTOR,
        count: 1,
      });
      if (!movie) throw new Error('no card');

      await within(movie).findByRole('button', {
        name: 'Add or remove "The Batman" from lists',
      });

      expect(movie.querySelector('.trakt-community-rating'))
        .toHaveTextContent('80%');
    });

    it('should remove the card unticked from the Watchlist and hand the focus to the section', async () => {
      stubClientRects();
      const listed = { items: WatchlistPreviewResponseMock };
      serve(
        () =>
          pagedResponse({ body: listed.items, itemCount: listed.items.length }),
        () => listed.items,
      );
      server.use(
        http.post(SYNC_WATCHLIST_REMOVE_URL, () => {
          listed.items = WatchlistPreviewResponseMock.slice(1);
          return HttpResponse.json({});
        }),
      );
      const { region, movie } = await readyFixtureCards();
      const listIcon = within(movie).getByRole('button', {
        name: 'Add or remove "The Batman" from lists',
      });
      await waitFor(() => expect(listIcon).toHaveClass('is-selected'));

      await userEvent.click(listIcon);
      const menu = await screen.findByRole('menu', { name: 'Add to list' });
      const watchlist = within(menu).getByRole('menuitemcheckbox', {
        name: 'Watchlist',
      });
      await waitFor(() =>
        expect(watchlist).toHaveAttribute('aria-checked', 'true')
      );
      await userEvent.click(watchlist);

      await waitFor(() => expect(movie.isConnected).toBe(false));
      await waitFor(() => expect(document.activeElement).toBe(region));
      expect(cards(region, CARD_SELECTOR)).toHaveLength(5);
    });
  });

  describe('rows', () => {
    afterEach(() => safeLocalStorage.clear());

    it('should lay the cards out as a poster grid of six, four and two up, with no gap below', async () => {
      const { region } = await readyFixtureCards();

      const grid = region.querySelector('.trakt-row-reveal-grid');
      expect(grid).toHaveAttribute('data-variant', 'posters');
      expect(grid).toHaveAttribute('data-bottom-gap', 'none');
      expect(grid?.getAttribute('style')).toBe(
        '--row-reveal-columns-desktop: 6; --row-reveal-columns-tablet: 4; --row-reveal-columns-mobile: 2;',
      );
    });

    it('should open two rows of six by default, with less and more', async () => {
      serve(() => pagedResponse({ body: EIGHTEEN_ITEMS, itemCount: 69 }));

      const region = await renderSection(SECTION);
      await readyCards({ region, selector: CARD_SELECTOR, count: 18 });

      expect(collapsedCells(region)).toHaveLength(6);
      expect(within(region).getByRole('button', { name: 'less' }))
        .toBeVisible();
      expect(within(region).getByRole('button', { name: 'more' }))
        .toBeVisible();
    });

    it('should keep its row count for its next render', async () => {
      serve(() => pagedResponse({ body: EIGHTEEN_ITEMS, itemCount: 69 }));
      const first = await renderSection(SECTION);
      await readyCards({ region: first, selector: CARD_SELECTOR, count: 18 });
      await userEvent.click(
        within(first).getByRole('button', { name: 'more' }),
      );
      cleanup();

      const region = await renderSection(SECTION);
      await readyCards({ region, selector: CARD_SELECTOR, count: 18 });
      expect(collapsedCells(region)).toHaveLength(0);
    });

    it("should open the row count set under Classic's list key", async () => {
      const store = await renderStore(() =>
        useRowCount({ key: 'list', rowMax: 3, defaultCount: 2 })
      );
      store.setRowCount(3);
      cleanup();
      serve(() => pagedResponse({ body: EIGHTEEN_ITEMS, itemCount: 69 }));

      const region = await renderSection(SECTION);
      await readyCards({ region, selector: CARD_SELECTOR, count: 18 });

      expect(collapsedCells(region)).toHaveLength(0);
    });
  });
});
