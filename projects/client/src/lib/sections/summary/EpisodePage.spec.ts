import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';
import { SILO_EPISODE_PARAMS } from '$mocks/data/shows/SILO_EPISODE_PARAMS.ts';
import { WELL_KNOWN_MEDIA_QUERY } from '$lib/stores/css/WELL_KNOWN_MEDIA_QUERY.ts';
import { toGroupedNumber } from '$lib/utils/formatting/number/toGroupedNumber.ts';
import { SILO_EPISODE_SUMMARY_URL } from '$mocks/data/shows/SILO_EPISODE_SUMMARY_URL.ts';
import { EpisodeSiloResponseMock } from '$mocks/data/summary/episodes/silo/response/EpisodeSiloResponseMock.ts';
import { server } from '$mocks/server.ts';
import { SILO_SEASONS_URL } from '$mocks/data/shows/SILO_SEASONS_URL.ts';
import { notFound } from '$test/beds/request/notFound.ts';
import { SILO_SEASON_ONE_EPISODES_URL } from '$mocks/data/shows/SILO_SEASON_ONE_EPISODES_URL.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { EpisodeSiloMappedMock } from '$mocks/data/summary/episodes/silo/mapped/EpisodeSiloMappedMock.ts';
import { EpisodeSiloPeopleMappedMock } from '$mocks/data/summary/episodes/silo/mapped/EpisodeSiloPeopleMappedMock.ts';
import { EpisodeSiloStatsMappedMock } from '$mocks/data/summary/episodes/silo/mapped/EpisodeSiloStatsMappedMock.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { ShowSiloSeasonsMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloSeasonsMappedMock.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { fakeLayouts } from '$test/beds/css/fakeLayouts.ts';
import { emulateHydrated } from '$test/beds/hydration/emulateHydrated.ts';
import { openAt } from '$test/beds/url/openAt.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import type { EpisodeResponse } from '@trakt/api';
import { screen, waitFor, within } from '@testing-library/svelte';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import EpisodePage from './EpisodePage.svelte';

const setLayout = fakeLayouts({
  desktop: WELL_KNOWN_MEDIA_QUERY.desktop,
  mobile: WELL_KNOWN_MEDIA_QUERY.mobile,
});

function serveEpisode(body: EpisodeResponse) {
  server.use(http.get(SILO_EPISODE_SUMMARY_URL, () => HttpResponse.json(body)));
}

const cornerNames = () =>
  screen.queryAllByRole('img', { name: /^Your rating/ }).map((corner) =>
    corner.getAttribute('aria-label')
  );

function findBreadcrumb() {
  return screen.findByRole('heading', { level: 2, name: /^Silo:/ });
}

function findSwitcher() {
  return screen.findByRole('navigation', { name: 'Episode' });
}

function renderPage() {
  setLayout('desktop');
  return renderComponent(EpisodePage, { props: SILO_EPISODE_PARAMS });
}

describe('component: EpisodePage', () => {
  describe('the document title', () => {
    it('should name the show, the episode number and its title in quotes', async () => {
      renderPage();

      await waitFor(() =>
        expect(document.title).toBe('Silo 1x01 "Freedom Day" · Trakt Classic')
      );
    });

    it('should drop the quotes for an untitled episode', async () => {
      serveEpisode({ ...EpisodeSiloResponseMock, title: null });
      renderPage();

      await waitFor(() =>
        expect(document.title).toBe('Silo 1x01 · Trakt Classic')
      );
    });
  });

  describe('the hero', () => {
    it("should title the page with the episode number, its title and the show's certification", async () => {
      renderPage();

      const heading = await screen.findByRole('heading', { level: 1 });

      expect(heading).toHaveTextContent(/^1x01 Freedom Day\s?TV-MA$/);
      expect(heading).toHaveAttribute('data-variant', 'episode');
      expect(heading.querySelector('.trakt-certification')).not.toBeNull();
    });

    it('should add the year it first aired once the app hydrates', async () => {
      renderPage();
      const heading = await screen.findByRole('heading', { level: 1 });

      emulateHydrated();

      await waitFor(() =>
        expect(heading).toHaveTextContent(/^1x01 Freedom Day 2023TV-MA$/)
      );
    });

    it('should lead the breadcrumb with the show, then the season', async () => {
      renderPage();

      const crumb = await findBreadcrumb();

      expect(within(crumb).getByRole('link', { name: 'Silo:' }))
        .toHaveAttribute('href', '/shows/silo');
      expect(within(crumb).getByRole('link', { name: 'Season 1' }))
        .toHaveAttribute('href', '/shows/silo/seasons/1');
      expect(crumb).toHaveTextContent(/^Silo: Season 1$/);
    });

    it('should tag a premiere above the breadcrumb', async () => {
      renderPage();

      const crumb = await findBreadcrumb();
      const tag = screen.getByText('Series Premiere');

      expect(
        tag.compareDocumentPosition(crumb) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    it('should tag no regular episode', async () => {
      serveEpisode({ ...EpisodeSiloResponseMock, episode_type: 'standard' });
      renderPage();

      await findBreadcrumb();

      expect(screen.queryByText('Series Premiere')).toBeNull();
    });

    it('should draw the screenshot behind the title', async () => {
      const { container } = renderPage();

      await screen.findByRole('heading', { level: 1 });

      expect(container.querySelector('.trakt-summary-hero img'))
        .toHaveAttribute('src', EpisodeSiloMappedMock.cover.url.full);
    });

    it('should rate this episode in the ratings bar', async () => {
      renderPage();

      expect(
        await screen.findByRole('button', {
          name: 'Rate this episode What did you think?',
        }),
      ).toBeVisible();
    });

    it('should keep the heart out before the episode is out', async () => {
      serveEpisode({
        ...EpisodeSiloResponseMock,
        effective_release_date: '2999-05-01T01:00:00.000Z',
      });
      const { container, userLoaded } = renderPage();
      await userLoaded;
      await screen.findByRole('button', { name: /^Rate this episode/ });
      await waitNegativeClaim();

      expect(
        container.querySelector('.ratings-community')?.matches(
          ':not(:has(*))',
        ),
      ).toBe(true);
    });

    it('should show the heart once the episode is out', async () => {
      renderPage();

      expect(await screen.findByText('7.2K votes')).toBeVisible();
    });
  });

  describe('the info column', () => {
    it('should follow the overview with the actors, the comments, then the lists', async () => {
      const { container } = renderPage();

      await screen.findByRole('link', { name: 'Actors' });

      expect(
        [...container.querySelectorAll('section[id]')].map(({ id }) => id),
      ).toEqual(['overview', 'actors', 'comments', 'lists']);
    });

    it('should count the lists in the sidebar', async () => {
      const lists = toGroupedNumber(EpisodeSiloStatsMappedMock.lists);
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

      expect(await screen.findByRole('link', { name: '102 Comments' }))
        .toHaveAttribute('href', '#comments');
    });

    it("should link the season's poster to the season", async () => {
      const { container } = renderPage();
      const poster = ShowSiloSeasonsMappedMock.at(0)?.poster?.url.thumb;

      await waitFor(() =>
        expect(container.querySelector(`a.sidebar-poster img[src="${poster}"]`))
          .not.toBeNull()
      );
      expect(container.querySelector('a.sidebar-poster'))
        .toHaveAttribute('href', '/shows/silo/seasons/1');
    });

    it('should link the episode on IMDb and on TMDB under its show', async () => {
      renderPage();

      expect(await screen.findByRole('link', { name: 'IMDb' }))
        .toHaveAttribute('href', 'https://www.imdb.com/title/tt14693272');
      expect(screen.getByRole('link', { name: 'TMDB' })).toHaveAttribute(
        'href',
        'https://www.themoviedb.org/tv/125988/season/1/episode/1',
      );
    });

    it('should show the overview beside the stats rows', async () => {
      renderPage();

      expect(await screen.findByText(EpisodeSiloResponseMock.overview ?? ''))
        .toBeInTheDocument();
      expect(screen.getByText('Runtime')).toBeInTheDocument();
    });

    it('should offer history and watchlist, and no favorite', async () => {
      renderPage();

      expect(await screen.findByRole('button', { name: /^Add to history/ }))
        .toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^Add to watchlist/ }))
        .toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /favorite/i })).toBeNull();
    });

    it('should show the Season Regulars, selected, then the Guest Stars', async () => {
      const { cast, guestStars } = EpisodeSiloPeopleMappedMock;
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
      const { slug, season, episode } = SILO_EPISODE_PARAMS;
      const { guestStars } = EpisodeSiloPeopleMappedMock;
      openAt(`${UrlBuilder.episode(slug, season, episode)}?actors=guest`);
      renderPage();

      const block = await screen.findByRole('region', { name: 'Actors' });

      expect(await within(block).findByRole('tab', { selected: true }))
        .toHaveTextContent(`Guest Stars ${guestStars.length}`);
      expect(
        within(within(block).getByRole('tabpanel')).getAllByRole('link')
          .map((link) => link.getAttribute('href')),
      ).toEqual(guestStars.map(({ key }) => `/people/${key}`));
    });
  });

  describe('the season poster', () => {
    it("should show the viewer's season rating in both poster corners", async () => {
      renderPage();

      await waitFor(() =>
        expect(cornerNames()).toEqual(['Your rating: 8', 'Your rating: 8'])
      );
    });

    it('should leave the corners out when the seasons fail', async () => {
      const showPoster =
        `a.sidebar-poster img[src="${ShowSiloMappedMock.poster.url.thumb}"]`;
      server.use(http.get(SILO_SEASONS_URL, notFound));
      const { container, userLoaded } = renderPage();
      await userLoaded;
      await waitFor(() =>
        expect(container.querySelector(showPoster)).not.toBeNull()
      );
      await waitNegativeClaim();

      expect(cornerNames()).toEqual([]);
    });

    it('should link the phone poster to the season', async () => {
      const { container } = renderPage();

      await findBreadcrumb();

      expect(container.querySelector('.hero-mobile-poster a'))
        .toHaveAttribute('href', '/shows/silo/seasons/1');
    });
  });

  describe('the episode switcher', () => {
    it("should list the season's episodes by number, marking this one", async () => {
      renderPage();
      const switcher = await findSwitcher();

      await waitFor(() =>
        expect(
          within(switcher).getAllByRole('link').map((link) =>
            link.textContent?.trim()
          ),
        ).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'])
      );
      expect(within(switcher).getByRole('link', { current: 'page' }))
        .toHaveTextContent('1');
      expect(within(switcher).getByRole('link', { name: '2' }))
        .toHaveAttribute('href', '/shows/silo/seasons/1/episodes/2');
    });

    it("should show its label while the season's episodes load", async () => {
      const episodes = holdRequest({
        method: 'get',
        url: SILO_SEASON_ONE_EPISODES_URL,
      });
      renderPage();
      await episodes.requested;

      const switcher = await findSwitcher();

      expect(switcher).toHaveTextContent(/^Episode$/);
      expect(within(switcher).queryAllByRole('link')).toHaveLength(0);
    });

    it('should open the info wrapper', async () => {
      renderPage();

      const switcher = await findSwitcher();

      expect(switcher.parentElement).toHaveAttribute('id', 'info-wrapper');
    });
  });

  describe('the neighbour links', () => {
    it('should link the next episode, and no previous one before 1x01', async () => {
      renderPage();

      const next = await screen.findByRole('link', { name: 'Next episode' });

      expect(next).toHaveAttribute('href', '/shows/silo/seasons/1/episodes/2');
      expect(next).toHaveAttribute('rel', 'next');
      expect(screen.queryByRole('link', { name: 'Previous episode' }))
        .toBeNull();
    });
  });
});
