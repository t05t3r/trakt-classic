import { EpisodeSiloResponseMock } from '$mocks/data/summary/episodes/silo/response/EpisodeSiloResponseMock.ts';
import { ShowSiloResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloResponseMock.ts';
import { ActivityHistoryResponseMock } from '$mocks/data/users/response/ActivityHistoryResponseMock.ts';
import { HISTORY_URL } from '$mocks/data/users/HISTORY_URL.ts';
import { EarlyRatingsUserSettingsResponseMock } from '$mocks/data/users/response/EarlyRatingsUserSettingsResponseMock.ts';
import { USER_SETTINGS_URL } from '$mocks/data/users/USER_SETTINGS_URL.ts';
import { WATCHED_SHOWS_URL } from '$mocks/data/users/WATCHED_SHOWS_URL.ts';
import { WELL_KNOWN_MEDIA_QUERY } from '$lib/stores/css/WELL_KNOWN_MEDIA_QUERY.ts';
import { SYNC_HISTORY_REMOVE_URL } from '$mocks/data/sync/SYNC_HISTORY_REMOVE_URL.ts';
import { server } from '$mocks/server.ts';
import { waitForEnabled } from '$test/beds/buttons/waitForEnabled.ts';
import { fakeLayouts } from '$test/beds/css/fakeLayouts.ts';
import { cards } from '$test/beds/dashboard/cards.ts';
import { readyCards } from '$test/beds/dashboard/readyCards.ts';
import { renderSection } from '$test/beds/dashboard/renderSection.ts';
import { answerDialog } from '$test/beds/dialogs/answerDialog.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { collapsedCells } from '$test/beds/pagination/collapsedCells.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { holdResponse } from '$test/beds/request/holdResponse.ts';
import { notFound } from '$test/beds/request/notFound.ts';
import { pagedResponse } from '$test/beds/request/pagedResponse.ts';
import { recordBodies } from '$test/beds/request/recordBodies.ts';
import { stubScrollIntoView } from '$test/beds/scroll/stubScrollIntoView.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { cleanup, screen, waitFor, within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import type { ActivityHistoryResponse } from '@trakt/api';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import RecentlyWatchedSection from './RecentlyWatchedSection.svelte';

// The list icon renders only once a layout matches.
const setLayout = fakeLayouts({ desktop: WELL_KNOWN_MEDIA_QUERY.desktop });

// Silo's episode `number`, watched as play `number`, an hour after the one before.
function siloPlay(number: number): ActivityHistoryResponse {
  return {
    id: number,
    watched_at: new Date(Date.UTC(2025, 0, 31, number)).toISOString(),
    action: 'watch',
    type: 'episode',
    episode: {
      ...EpisodeSiloResponseMock,
      ids: { ...EpisodeSiloResponseMock.ids, trakt: 7000 + number },
      number,
      title: `Episode ${number}`,
      episode_type: 'standard',
    },
    show: ShowSiloResponseMock,
  };
}

// Nine plays fill the three desktop rows of three.
const NINE_PLAYS = Array.from({ length: 9 }, (_, index) => siloPlay(index + 1));

function serve(
  answer: (info: { request: Request }) => Response | Promise<Response>,
) {
  server.use(http.get(HISTORY_URL, answer));
}

const SECTION = { component: RecentlyWatchedSection, name: 'Recently Watched' };

const CARD_SELECTOR = '.trakt-fanart-card';

// The fixture's episode card, then its movie card.
async function readyFixtureCards() {
  const region = await renderSection(SECTION);
  const [episode, movie] = await readyCards({
    region,
    selector: CARD_SELECTOR,
    count: 2,
  });
  if (!episode || !movie) throw new Error('no cards');

  return { region, episode, movie };
}

// Waits for the strip's buttons, which load the user's state first.
async function settledIcons(card: HTMLElement, count: number) {
  return await waitFor(() => {
    const icons = [...card.querySelectorAll('.trakt-quick-icon')];
    expect(icons).toHaveLength(count);
    icons.forEach((icon) =>
      expect(icon).toHaveAttribute('aria-disabled', 'false')
    );
    return icons;
  });
}

// The fixture's plays, with the episode's or the movie's dates replaced.
function datedPlays(dates: {
  episode?: {
    first_aired: string | null;
    effective_release_date?: string | null;
  };
  movie?: { released: string | null };
}): ActivityHistoryResponse[] {
  return ActivityHistoryResponseMock.map((play) => {
    if (play.type === 'episode' && play.episode) {
      return { ...play, episode: { ...play.episode, ...dates.episode } };
    }
    if (play.type === 'movie' && play.movie) {
      return { ...play, movie: { ...play.movie, ...dates.movie } };
    }
    return play;
  });
}

describe('section: RecentlyWatchedSection', () => {
  beforeEach(() => setLayout('desktop'));

  it('should hold the header with its spinner and no body while loading', async () => {
    serve(holdResponse(() => pagedResponse({ body: [] })).answer);

    const region = await renderSection(SECTION);

    const heading = within(region).getByRole('heading', { level: 2 });
    expect(region).toHaveAttribute('aria-busy', 'true');
    expect(heading).toHaveTextContent('Recently Watched');
    expect(heading.querySelector('.section-title-spinner')).not.toBeNull();
    expect(region.querySelector('.help-text')).toBeNull();
    expect(region.querySelector('.trakt-empty-state')).toBeNull();
    expect(cards(region, CARD_SELECTOR)).toEqual([]);
  });

  it('should space its header wide', async () => {
    const region = await renderSection(SECTION);

    expect(region.querySelector('.trakt-section-header'))
      .toHaveAttribute('data-spacing', 'wide');
  });

  it('should link the header to the history page', async () => {
    const region = await renderSection(SECTION);

    expect(within(region).getByRole('link', { name: 'History' }))
      .toHaveAttribute('href', '/users/me/history');
  });

  it('should show the empty box for no history', async () => {
    serve(() => pagedResponse({ body: [] }));

    const region = await renderSection(SECTION);

    expect(await within(region).findByText('No recent history.'))
      .toBeVisible();
    expect(region).toHaveAttribute('aria-busy', 'false');
  });

  it('should show the error box and load the cards on Retry', async () => {
    serve(notFound);
    const region = await renderSection(SECTION);
    const retry = await within(region).findByRole('button', { name: 'Retry' });
    expect(region).toHaveTextContent("Couldn't load this section.");

    serve(() => pagedResponse({ body: ActivityHistoryResponseMock }));
    await userEvent.click(retry);

    expect(
      await within(region).findByRole('link', { name: '1x01 Freedom Day' }),
    ).toBeVisible();
  });

  describe('cards', () => {
    it('should request the first page of nine plays only', async () => {
      const requests: URL[] = [];
      serve(({ request }) => {
        requests.push(new URL(request.url));
        return pagedResponse({
          body: ActivityHistoryResponseMock,
          pageCount: 3,
        });
      });

      const region = await renderSection(SECTION);
      await readyCards({ region, selector: CARD_SELECTOR, count: 2 });

      expect(
        requests.map((url) => ({
          page: url.searchParams.get('page'),
          limit: url.searchParams.get('limit'),
        })),
      ).toEqual([{ page: '1', limit: '9' }]);
    });

    it('should render one card per play, in the order served', async () => {
      const { region, episode, movie } = await readyFixtureCards();

      expect(episode.querySelector('h3')).toHaveTextContent(
        '1x01 Freedom Day',
      );
      expect(movie.querySelector('h3')).toHaveTextContent('Heretic 2024');
      expect(region).toHaveAttribute('aria-busy', 'false');
    });

    it('should link an episode card to its episode and its show name to the show', async () => {
      const { episode } = await readyFixtureCards();

      expect(episode.querySelector('a.fanart-link')).toHaveAttribute(
        'href',
        '/shows/silo/seasons/1/episodes/1',
      );
      expect(within(episode).getByRole('link', { name: '1x01 Freedom Day' }))
        .toHaveAttribute('href', '/shows/silo/seasons/1/episodes/1');
      expect(within(episode).getByRole('link', { name: 'Silo' }))
        .toHaveAttribute('href', '/shows/silo');
    });

    it('should link a movie card to its movie, with no show name', async () => {
      const { movie } = await readyFixtureCards();

      expect(movie.querySelector('a.fanart-link'))
        .toHaveAttribute('href', '/movies/heretic-2024');
      expect(within(movie).getByRole('link', { name: 'Heretic 2024' }))
        .toHaveAttribute('href', '/movies/heretic-2024');
      expect(movie.querySelector('h5')).toBeNull();
    });

    it("should show the episode's screenshot and the movie's fanart", async () => {
      const { episode, movie } = await readyFixtureCards();

      expect(episode.querySelector('img:not(.placeholder)')).toHaveAttribute(
        'src',
        '/img/episodes/005/165/667/screenshots/thumb/e035db5f06.jpg.webp',
      );
      expect(movie.querySelector('img:not(.placeholder)')).toHaveAttribute(
        'src',
        '/img/movies/000/916/302/fanarts/thumb/626327d7b4.jpg.webp',
      );
    });

    it('should name each art link by its image alone, with the rating corner shown', async () => {
      const { episode, movie } = await readyFixtureCards();
      await waitFor(() =>
        [episode, movie].forEach((card) =>
          expect(card.querySelector('.trakt-corner-rating')).not.toBeNull()
        )
      );

      expect(
        within(episode).getByRole('link', { name: 'Silo 1x01 screenshot' }),
      ).toHaveClass('fanart-link');
      expect(
        within(movie).getByRole('link', { name: '"Heretic" fanart' }),
      ).toHaveClass('fanart-link');
    });

    it('should name an art link with no screenshot by its tooltip', async () => {
      const play: ActivityHistoryResponse = {
        id: 1,
        watched_at: '2025-01-31T23:12:41.000Z',
        action: 'watch',
        type: 'episode',
        episode: { ...EpisodeSiloResponseMock, images: undefined },
        show: ShowSiloResponseMock,
      };
      serve(() => pagedResponse({ body: [play] }));
      const region = await renderSection(SECTION);
      const [card] = await readyCards({
        region,
        selector: CARD_SELECTOR,
        count: 1,
      });
      if (!card) throw new Error('no card');

      expect(card.querySelector('img:not(.placeholder)')).toBeNull();
      expect(
        within(card).getByRole('link', { name: 'Silo\n1x01 "Freedom Day"' }),
      ).toHaveClass('fanart-link');
    });

    it("should caption an episode with its type before the play's date", async () => {
      const { episode } = await readyFixtureCards();

      const caption = episode.querySelector('.caption');
      expect(
        [...(caption?.children ?? [])].map((tag) => tag.textContent?.trim()),
      ).toEqual(['Series Premiere', '31 Jan 2025 23:12']);
      expect(caption?.querySelector('.trakt-caption-tag'))
        .toHaveTextContent('31 Jan 2025 23:12');
    });

    it("should caption a movie with the play's date only", async () => {
      const { movie } = await readyFixtureCards();

      expect(movie.querySelector('.trakt-episode-type-tag')).toBeNull();
      expect(movie.querySelector('.caption .trakt-caption-tag'))
        .toHaveTextContent('31 Jan 2025 23:12');
    });

    it("should rate a Play's card from its percentage, so a slow history cannot block it", async () => {
      stubClientRects();
      holdRequest({ method: 'get', url: WATCHED_SHOWS_URL });
      serve(() => pagedResponse({ body: [siloPlay(1)] }));
      const region = await renderSection(SECTION);
      const [card] = await readyCards({
        region,
        selector: CARD_SELECTOR,
        count: 1,
      });
      if (!card) throw new Error('no card');
      const button = await within(card).findByRole('button', {
        name: /^\d+%/,
      });

      await userEvent.click(await waitForEnabled(button));

      expect(await screen.findByRole('dialog', { name: 'Rate this episode' }))
        .toHaveAttribute('data-side', 'bottom');
    });

    it("should mark each card with the user's rating of its own episode or movie", async () => {
      const { episode, movie } = await readyFixtureCards();

      await waitFor(() =>
        expect(within(episode).getByRole('img', { name: 'Your rating: 10' }))
          .toHaveTextContent('10')
      );
      expect(within(movie).getByRole('img', { name: 'Your rating: 10' }))
        .toHaveTextContent('10');
    });

    it("should give an episode card the full-size icons, its show's favourite and the community rating", async () => {
      const { episode } = await readyFixtureCards();

      const icons = await settledIcons(episode, 3);

      expect(icons.map((icon) => icon.getAttribute('aria-label'))).toEqual([
        'Remove "Freedom Day" from your History',
        'Add or remove "Freedom Day" from lists',
        'Remove "Silo" from your Favorites',
      ]);
      expect(episode.querySelector('.trakt-quick-actions'))
        .toHaveAttribute('data-size', 'full');
      expect(episode.querySelector('.trakt-community-rating'))
        .toHaveTextContent('78%');
      expect(episode.querySelector('.trakt-community-rating'))
        .toHaveAttribute('data-variant', 'default');
    });

    it("should give an episode card the Play's date and time on a hover", async () => {
      const { episode } = await readyFixtureCards();
      const [watch] = await settledIcons(episode, 3);

      await userEvent.hover(assertDefined(watch));

      await waitFor(() =>
        expect(watch).toHaveAccessibleDescription('Watched on 31 Jan 2025 1h')
      );
    });

    it("should select an episode card's watch icon though the watched history holds no play of that episode", async () => {
      const { episode } = await readyFixtureCards();

      const [watch] = await settledIcons(episode, 3);

      expect(watch).toHaveAttribute(
        'aria-label',
        'Remove "Freedom Day" from your History',
      );
      expect(watch).toHaveClass('is-selected');
    });

    it('should give a watched episode with no air or effective release date its selected watch icon and no community rating', async () => {
      serve(() =>
        pagedResponse({
          body: datedPlays({
            episode: { first_aired: null, effective_release_date: null },
          }),
        })
      );
      const { episode } = await readyFixtureCards();

      const [watch] = await settledIcons(episode, 3);

      expect(watch).toHaveAttribute(
        'aria-label',
        'Remove "Freedom Day" from your History',
      );
      expect(watch).toHaveClass('is-selected');
      expect(episode.querySelector('.trakt-community-rating')).toBeNull();
    });

    it('should give a watched movie with no release date its selected watch icon and no community rating', async () => {
      serve(() =>
        pagedResponse({
          body: datedPlays({ movie: { released: null } }),
        })
      );
      const { movie } = await readyFixtureCards();

      const [watch] = await settledIcons(movie, 3);

      expect(watch).toHaveAttribute(
        'aria-label',
        'Remove "Heretic" from your History',
      );
      expect(watch).toHaveClass('is-selected');
      expect(movie.querySelector('.trakt-community-rating')).toBeNull();
    });

    it('should show the community rating of a movie with no release date to a user who displays early ratings', async () => {
      server.use(
        http.get(
          USER_SETTINGS_URL,
          () => HttpResponse.json(EarlyRatingsUserSettingsResponseMock),
        ),
      );
      serve(() =>
        pagedResponse({
          body: datedPlays({ movie: { released: null } }),
        })
      );
      const { movie } = await readyFixtureCards();

      await settledIcons(movie, 3);

      expect(movie.querySelector('.trakt-community-rating'))
        .toHaveTextContent('72%');
    });

    it('should give a watched episode whose air and effective release dates do not parse its selected watch icon and no community rating', async () => {
      serve(() =>
        pagedResponse({
          body: datedPlays({
            episode: {
              first_aired: 'not a date',
              effective_release_date: 'not a date',
            },
          }),
        })
      );
      const { episode } = await readyFixtureCards();

      const [watch] = await settledIcons(episode, 3);

      expect(watch).toHaveAttribute(
        'aria-label',
        'Remove "Freedom Day" from your History',
      );
      expect(watch).toHaveClass('is-selected');
      expect(episode.querySelector('.trakt-community-rating')).toBeNull();
    });

    it.each(
      [
        { type: 'episode', id: 1 },
        { type: 'movie', id: 2 },
      ] as const,
    )(
      "should ask about the Play on a $type card's watch and post that entry's id",
      async ({ type, id }) => {
        const bodies = recordBodies(SYNC_HISTORY_REMOVE_URL);
        const fixture = await readyFixtureCards();
        const [watch] = await settledIcons(fixture[type], 3);
        if (!(watch instanceof HTMLElement)) throw new Error('no watch icon');

        await userEvent.click(watch);
        await answerDialog('Remove from history?', 'Only this play');

        await waitFor(() => expect(bodies).toEqual([{ ids: [id] }]));
      },
    );

    it('should keep the watch icon of an episode with no air date in place and pending while a confirmed remove is held', async () => {
      holdRequest({
        method: 'post',
        url: SYNC_HISTORY_REMOVE_URL,
        answer: () => new HttpResponse(null, { status: 200 }),
      });
      serve(() =>
        pagedResponse({
          body: datedPlays({ episode: { first_aired: null } }),
        })
      );
      const { episode } = await readyFixtureCards();
      const [watch] = await settledIcons(episode, 3);
      if (!(watch instanceof HTMLElement)) throw new Error('no watch icon');

      await userEvent.click(watch);
      await answerDialog('Remove from history?', 'Only this play');

      await waitFor(() => expect(watch).toHaveAttribute('aria-busy', 'true'));
      expect(watch).toHaveAttribute(
        'aria-label',
        'Remove "Freedom Day" from your History',
      );
      expect(episode).toContainElement(watch);
    });

    it("should give a movie card the movie's favourite", async () => {
      const { movie } = await readyFixtureCards();

      const icons = await settledIcons(movie, 3);

      expect(icons.at(2)).toHaveAttribute(
        'aria-label',
        'Remove "Heretic" from your Favorites',
      );
    });
  });

  describe('rows', () => {
    it('should lay the cards out as a fanart grid of three, two and one up', async () => {
      const { region } = await readyFixtureCards();

      const grid = region.querySelector('.trakt-row-reveal-grid');
      expect(grid).toHaveAttribute('data-variant', 'fanart');
      expect(grid?.getAttribute('style')).toBe(
        '--row-reveal-columns-desktop: 3; --row-reveal-columns-tablet: 2; --row-reveal-columns-mobile: 1;',
      );
    });

    it('should open one row of three by default, with more only', async () => {
      serve(() => pagedResponse({ body: NINE_PLAYS }));

      const region = await renderSection(SECTION);
      await readyCards({ region, selector: CARD_SELECTOR, count: 9 });

      expect(collapsedCells(region)).toHaveLength(6);
      expect(within(region).getByRole('button', { name: 'more' }))
        .toBeVisible();
      expect(within(region).queryByRole('button', { name: 'less' }))
        .toBeNull();
    });

    it('should open the stored rows after a remount', async () => {
      serve(() => pagedResponse({ body: NINE_PLAYS }));
      const first = await renderSection(SECTION);
      await readyCards({ region: first, selector: CARD_SELECTOR, count: 9 });
      await userEvent.click(
        within(first).getByRole('button', { name: 'more' }),
      );
      expect(collapsedCells(first)).toHaveLength(3);
      cleanup();

      const region = await renderSection(SECTION);
      await readyCards({ region, selector: CARD_SELECTOR, count: 9 });
      expect(collapsedCells(region)).toHaveLength(3);
    });

    it('should hand the focus to the section when its card collapses', async () => {
      // "less" scrolls its controls into view, which jsdom cannot do.
      stubScrollIntoView();
      serve(() => pagedResponse({ body: NINE_PLAYS }));
      const region = await renderSection(SECTION);
      const fourth =
        (await readyCards({ region, selector: CARD_SELECTOR, count: 9 })).at(3);
      const link = fourth?.querySelector<HTMLElement>('a.fanart-link');
      if (!link) throw new Error('no fourth card');
      await userEvent.click(
        within(region).getByRole('button', { name: 'more' }),
      );
      await waitFor(() => expect(collapsedCells(region)).toHaveLength(3));

      link.focus();
      within(region).getByRole('button', { name: 'less' }).click();

      await waitFor(() => expect(collapsedCells(region)).toHaveLength(6));
      expect(document.activeElement).toBe(region);
    });
  });
});
