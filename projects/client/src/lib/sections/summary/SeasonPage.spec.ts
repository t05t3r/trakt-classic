import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { toGroupedNumber } from '$lib/utils/formatting/number/toGroupedNumber.ts';
import { toTraktRating } from '$lib/utils/formatting/number/toTraktRating.ts';
import { SILO_SEASON_PARAMS } from '$mocks/data/shows/SILO_SEASON_PARAMS.ts';
import { SILO_SEASON_STATS_URL } from '$mocks/data/shows/SILO_SEASON_STATS_URL.ts';
import { WELL_KNOWN_MEDIA_QUERY } from '$lib/stores/css/WELL_KNOWN_MEDIA_QUERY.ts';
import { SeasonSiloResponseMock } from '$mocks/data/summary/seasons/silo/response/SeasonSiloResponseMock.ts';
import { SeasonSiloStatsResponseMock } from '$mocks/data/summary/seasons/silo/response/SeasonSiloStatsResponseMock.ts';
import { SeasonSiloMappedMock } from '$mocks/data/summary/seasons/silo/mapped/SeasonSiloMappedMock.ts';
import { SeasonSiloStatsMappedMock } from '$mocks/data/summary/seasons/silo/mapped/SeasonSiloStatsMappedMock.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { ShowSiloPeopleMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloPeopleMappedMock.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { fakeLayouts } from '$test/beds/css/fakeLayouts.ts';
import { emulateHydrated } from '$test/beds/hydration/emulateHydrated.ts';
import { openAt } from '$test/beds/url/openAt.ts';
import { server } from '$mocks/server.ts';
import { SILO_SEASONS_URL } from '$mocks/data/shows/SILO_SEASONS_URL.ts';
import { ShowSiloSeasonsWithSpecialsResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloSeasonsWithSpecialsResponseMock.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { screen, waitFor, within } from '@testing-library/svelte';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import SeasonPage from './SeasonPage.svelte';

const setLayout = fakeLayouts({
  desktop: WELL_KNOWN_MEDIA_QUERY.desktop,
  mobile: WELL_KNOWN_MEDIA_QUERY.mobile,
});

// The episode rows' fanart cards carry corners of their own.
const posterCornerNames = () =>
  screen.queryAllByRole('img', { name: /^Your rating/ })
    .filter((corner) => !corner.closest('.trakt-fanart-card'))
    .map((corner) => corner.getAttribute('aria-label'));

const historyButton = () => screen.findByRole('button', { name: /^Watched/ });

function findBreadcrumb() {
  return screen.findByRole('heading', { level: 2, name: 'Silo' });
}

function serveSeasonsWithSpecials() {
  server.use(
    http.get(
      SILO_SEASONS_URL,
      () => HttpResponse.json(ShowSiloSeasonsWithSpecialsResponseMock),
    ),
  );
}

function findSwitcher() {
  return screen.findByRole('navigation', { name: 'Season' });
}

function renderPage() {
  setLayout('desktop');
  return renderComponent(SeasonPage, { props: SILO_SEASON_PARAMS });
}

describe('component: SeasonPage', () => {
  it('should title the document with the show, then the season', async () => {
    renderPage();

    await waitFor(() =>
      expect(document.title).toBe('Silo Season 1 · Trakt Classic')
    );
  });

  describe('the hero', () => {
    it("should title the page with the season and the show's certification", async () => {
      renderPage();

      const heading = await screen.findByRole('heading', { level: 1 });

      expect(heading).toHaveTextContent(/^Season 1\s?TV-MA$/);
      expect(heading.querySelector('.trakt-certification')).not.toBeNull();
    });

    it('should add the year it first aired once the app hydrates', async () => {
      renderPage();
      const heading = await screen.findByRole('heading', { level: 1 });

      emulateHydrated();

      await waitFor(() =>
        expect(heading).toHaveTextContent(/^Season 1 2023TV-MA$/)
      );
    });

    it("should lead with the show's bare title, linked to the show", async () => {
      renderPage();

      const crumb = await findBreadcrumb();

      expect(within(crumb).getByRole('link', { name: 'Silo' }))
        .toHaveAttribute('href', '/shows/silo');
      expect(crumb).toHaveTextContent(/^Silo$/);
    });

    it("should draw the show's fanart behind the title", async () => {
      const { container } = renderPage();

      await screen.findByRole('heading', { level: 1 });

      expect(container.querySelector('.trakt-summary-hero img'))
        .toHaveAttribute('src', ShowSiloMappedMock.cover.url.full);
    });

    it('should link the phone poster to the show', async () => {
      const { container } = renderPage();

      await findBreadcrumb();

      expect(container.querySelector('.hero-mobile-poster a'))
        .toHaveAttribute('href', '/shows/silo');
    });

    it('should rate this season in the ratings bar', async () => {
      renderPage();

      expect(
        await screen.findByRole('button', {
          name: 'Rate this season What did you think?',
        }),
      ).toBeVisible();
    });

    it("should show the season's heart and votes", async () => {
      const { container } = renderPage();

      expect(await screen.findByText('2.4K votes')).toBeVisible();
      const bar = assertDefined(
        container.querySelector<HTMLElement>('.trakt-summary-ratings'),
      );
      expect(
        within(bar).getByText(
          toTraktRating(assertDefined(SeasonSiloMappedMock.rating)),
        ),
      ).toBeVisible();
    });
  });

  describe('the info column', () => {
    it('should follow the overview with the actors, the episodes, the comments, then the lists', async () => {
      const { container } = renderPage();

      await screen.findByRole('link', { name: 'Actors' });

      expect(
        [...container.querySelectorAll('section[id]')].map(({ id }) => id),
      ).toEqual(['overview', 'actors', 'episodes', 'comments', 'lists']);
    });

    it("should count the season's episodes in the sidebar", async () => {
      renderPage();

      expect(await screen.findByRole('link', { name: '10 Episodes' }))
        .toHaveAttribute('href', '#episodes');
    });

    it("should list the season's episodes, by number, under their count", async () => {
      const { container } = renderPage();

      const block = await waitFor(() => {
        const section = container.querySelector<HTMLElement>('#episodes');
        expect(section?.querySelectorAll('.under-info h3')).toHaveLength(10);
        return assertDefined(section);
      });

      expect(within(block).getByRole('heading', { level: 2 }))
        .toHaveTextContent('10 Episodes');
      expect(block.querySelector('.under-info h3'))
        .toHaveTextContent('1x01 Freedom Day');
    });

    it('should count the lists in the sidebar', async () => {
      const lists = toGroupedNumber(SeasonSiloStatsMappedMock.lists);
      renderPage();

      expect(await screen.findByRole('link', { name: `${lists} Lists` }))
        .toHaveAttribute('href', '#lists');
    });

    it('should show the official lists, then the personal ones, under #lists', async () => {
      renderPage();
      const block = await screen.findByRole('region', { name: 'Lists' });

      const names = await within(block).findAllByRole('heading', { level: 3 });

      expect(block.closest('section#lists')).not.toBeNull();
      expect(names.map(({ textContent }) => textContent?.trim())).toEqual([
        'Official list',
        'Silos',
      ]);
    });

    it('should count the comments in the sidebar', async () => {
      renderPage();

      expect(await screen.findByRole('link', { name: '64 Comments' }))
        .toHaveAttribute('href', '#comments');
    });

    it('should count a single comment in the singular', async () => {
      server.use(
        http.get(
          SILO_SEASON_STATS_URL,
          () =>
            HttpResponse.json({ ...SeasonSiloStatsResponseMock, comments: 1 }),
        ),
      );
      renderPage();

      expect(await screen.findByRole('link', { name: '1 Comment' }))
        .toHaveAttribute('href', '#comments');
    });

    it("should link the season's poster to the show", async () => {
      const { container } = renderPage();
      const poster = SeasonSiloMappedMock.poster?.url.thumb;

      await waitFor(() =>
        expect(container.querySelector(`a.sidebar-poster img[src="${poster}"]`))
          .not.toBeNull()
      );
      expect(container.querySelector('a.sidebar-poster'))
        .toHaveAttribute('href', '/shows/silo');
    });

    it("should link the season on IMDb and TMDB under its show's ids", async () => {
      renderPage();

      expect(await screen.findByRole('link', { name: 'IMDb' })).toHaveAttribute(
        'href',
        'https://www.imdb.com/title/tt14688458/episodes?season=1',
      );
      expect(screen.getByRole('link', { name: 'TMDB' })).toHaveAttribute(
        'href',
        'https://www.themoviedb.org/tv/125988/season/1',
      );
    });

    it('should show the overview beside the stats rows', async () => {
      renderPage();

      expect(await screen.findByText(SeasonSiloResponseMock.overview ?? ''))
        .toBeInTheDocument();
      expect(screen.getByText('Total Runtime')).toBeInTheDocument();
    });

    it("should follow the season's progress in the history button", async () => {
      renderPage();

      expect(await historyButton()).toHaveTextContent(
        '10 of 10 episodes · last 27 Dec 2024',
      );
    });

    it('should offer the watchlist, and no favorite', async () => {
      renderPage();

      expect(await screen.findByRole('button', { name: /^In watchlist/ }))
        .toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /favorite/i })).toBeNull();
    });

    it('should show the Season Regulars, selected, then the Guest Stars', async () => {
      const { cast, guestStars } = ShowSiloPeopleMappedMock;
      renderPage();

      const block = await screen.findByRole('region', { name: 'Actors' });

      expect(await within(block).findByRole('tab', { selected: true }))
        .toHaveTextContent(`Season Regulars ${cast.length}`);
      expect(
        within(block).getAllByRole('tab').map((tab) => tab.textContent?.trim()),
      ).toEqual([
        `Season Regulars ${cast.length}`,
        `Guest Stars ${guestStars.length}`,
      ]);
    });

    it('should open on the Guest Stars when the URL asks for them', async () => {
      const { slug, season } = SILO_SEASON_PARAMS;
      const { guestStars } = ShowSiloPeopleMappedMock;
      openAt(`${UrlBuilder.season(slug, season)}?actors=guest`);
      renderPage();

      const block = await screen.findByRole('region', { name: 'Actors' });

      expect(await within(block).findByRole('tab', { selected: true }))
        .toHaveTextContent(`Guest Stars ${guestStars.length}`);
      expect(
        within(within(block).getByRole('tabpanel')).getAllByRole('link')
          .map((link) => link.getAttribute('href')),
      ).toEqual(guestStars.map(({ key }) => `/people/${key}`));
    });

    it("should show the viewer's season rating in both poster corners", async () => {
      renderPage();

      await waitFor(() =>
        expect(posterCornerNames()).toEqual([
          'Your rating: 8',
          'Your rating: 8',
        ])
      );
    });
  });

  describe('the season switcher', () => {
    it('should list the seasons newest first, the specials last, marking this one', async () => {
      serveSeasonsWithSpecials();
      renderPage();
      const switcher = await findSwitcher();

      await waitFor(() =>
        expect(
          within(switcher).getAllByRole('link').map((link) => [
            link.textContent?.trim(),
            link.getAttribute('aria-current'),
          ]),
        ).toEqual([
          ['3', null],
          ['2', null],
          ['1', 'page'],
          ['Specials', null],
        ])
      );
      expect(within(switcher).getByRole('link', { name: '2' }))
        .toHaveAttribute('href', '/shows/silo/seasons/2');
    });

    it('should show its label while the seasons load', async () => {
      const seasons = holdRequest({ method: 'get', url: SILO_SEASONS_URL });
      renderPage();
      await seasons.requested;

      const switcher = await findSwitcher();

      expect(switcher).toHaveTextContent(/^Season$/);
      expect(within(switcher).queryAllByRole('link')).toHaveLength(0);
    });

    it('should open the info wrapper', async () => {
      renderPage();

      const switcher = await findSwitcher();

      expect(switcher.parentElement).toHaveAttribute('id', 'info-wrapper');
    });
  });

  describe('the neighbour links', () => {
    it('should link the seasons either side', async () => {
      serveSeasonsWithSpecials();
      renderPage();

      const previous = await screen.findByRole('link', {
        name: 'Previous season',
      });
      const next = screen.getByRole('link', { name: 'Next season' });

      expect(previous).toHaveAttribute('href', '/shows/silo/seasons/0');
      expect(previous).toHaveAttribute('rel', 'prev');
      expect(next).toHaveAttribute('href', '/shows/silo/seasons/2');
      expect(next).toHaveAttribute('rel', 'next');
    });
  });
});
