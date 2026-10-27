import { WELL_KNOWN_MEDIA_QUERY } from '$lib/stores/css/WELL_KNOWN_MEDIA_QUERY.ts';
import { useRowCount } from '$lib/stores/useRowCount.ts';
import type {
  RecommendationsMovieResponse,
  RecommendationsShowResponse,
} from '$lib/requests/models/RecommendationsResponse.ts';
import { safeLocalStorage } from '$lib/utils/storage/safeLocalStorage.ts';
import { MovieHereticResponseMock } from '$mocks/data/summary/movies/heretic/response/MovieHereticResponseMock.ts';
import { ShowSiloResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloResponseMock.ts';
import { EarlyRatingsUserSettingsResponseMock } from '$mocks/data/users/response/EarlyRatingsUserSettingsResponseMock.ts';
import { USER_SETTINGS_URL } from '$mocks/data/users/USER_SETTINGS_URL.ts';
import { RECOMMENDED_SHOWS_URL } from '$mocks/data/recommendations/RECOMMENDED_SHOWS_URL.ts';
import { RECOMMENDED_MOVIES_URL } from '$mocks/data/recommendations/RECOMMENDED_MOVIES_URL.ts';
import { server } from '$mocks/server.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { fakeLayouts } from '$test/beds/css/fakeLayouts.ts';
import { REMOVALS } from '$test/beds/focus/REMOVALS.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { holdResponse } from '$test/beds/request/holdResponse.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { cleanup, screen, waitFor, within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import RecommendationsSection from './RecommendationsSection.svelte';

const setLayout = fakeLayouts({
  desktop: WELL_KNOWN_MEDIA_QUERY.desktop,
  mobile: WELL_KNOWN_MEDIA_QUERY.mobile,
});

function shows(count: number): RecommendationsShowResponse {
  return Array.from({ length: count }, (_, index) => ({
    show: {
      ...ShowSiloResponseMock,
      title: `Show ${index + 1}`,
      ids: {
        ...ShowSiloResponseMock.ids,
        trakt: 1000 + index,
        slug: `show-${index + 1}`,
      },
    },
    score: 8.5,
    sources: [],
  }));
}

function movies(count: number): RecommendationsMovieResponse {
  return Array.from({ length: count }, (_, index) => ({
    movie: {
      ...MovieHereticResponseMock,
      title: `Movie ${index + 1}`,
      ids: {
        ...MovieHereticResponseMock.ids,
        trakt: 2000 + index,
        slug: `movie-${index + 1}`,
      },
    },
    score: 8.5,
    sources: [],
  }));
}

type Answer = () => Response | Promise<Response>;

function serve({ shows, movies }: { shows: Answer; movies: Answer }) {
  server.use(
    http.get(RECOMMENDED_SHOWS_URL, shows),
    http.get(RECOMMENDED_MOVIES_URL, movies),
  );
}

const json =
  (body: RecommendationsShowResponse | RecommendationsMovieResponse) => () =>
    HttpResponse.json(body);

async function renderRegions() {
  const { container, userLoaded } = renderComponent(RecommendationsSection, {
    props: {},
  });
  await userLoaded;

  return {
    container,
    shows: await screen.findByRole('region', { name: 'Show Recommendations' }),
    movies: await screen.findByRole('region', {
      name: 'Movie Recommendations',
    }),
  };
}

function cells(region: HTMLElement) {
  return region.querySelectorAll('.row-reveal-cell');
}

function openCells(region: HTMLElement) {
  return region.querySelectorAll('.row-reveal-cell:not(.is-collapsed)');
}

async function readyCells(region: HTMLElement, count: number) {
  await waitFor(() => expect(cells(region)).toHaveLength(count));
}

// The shared navigator sits under both columns, outside either column.
function sharedButton(name: 'less' | 'more') {
  return screen.queryAllByRole('button', { name })
    .find((button) => button.closest('.recommendations-column') == null);
}

// A phone navigator sits in its column, under the column's section.
function columnOf(region: HTMLElement) {
  const column = region.closest<HTMLElement>('.recommendations-column');
  if (!column) throw new Error('no column');
  return column;
}

function phoneButton(region: HTMLElement, name: 'less' | 'more') {
  return within(columnOf(region)).queryByRole('button', { name });
}

function phoneControls(region: HTMLElement) {
  return Array.from(
    columnOf(region).querySelectorAll('.trakt-load-more .load-more-control'),
  ).map((control) => control.textContent?.trim());
}

function titles(region: HTMLElement) {
  return [...region.querySelectorAll('.trakt-poster-card h3')]
    .map((heading) => heading.textContent?.trim());
}

function hideButton(region: HTMLElement, title: string) {
  return within(region).getByRole('button', {
    name: `Hide "${title}" from recommendations`,
  });
}

// Holds the hide of the movie with this slug until its release or the test ends.
function holdMovieHide(slug: string, failureStatus?: number) {
  return holdRequest({
    method: 'delete',
    url: `http://localhost/recommendations/movies/${slug}`,
    answer: failureStatus == null
      ? undefined
      : () => new HttpResponse(null, { status: failureStatus }),
  });
}

async function clickShared(name: 'less' | 'more') {
  const button = sharedButton(name);
  if (!button) throw new Error(`no shared ${name}`);
  await userEvent.click(button);
}

describe('section: RecommendationsSection', () => {
  beforeEach(() => {
    setLayout('desktop');
  });

  afterEach(() => safeLocalStorage.clear());

  it('should render the show and the movie column from their queries', async () => {
    const { shows, movies } = await renderRegions();

    expect(await within(shows).findByRole('link', { name: 'Silo' }))
      .toBeVisible();
    expect(await within(movies).findByRole('link', { name: 'Heretic' }))
      .toBeVisible();
  });

  it('should show the community rating of a movie with no release date to a user who displays early ratings', async () => {
    server.use(
      http.get(
        USER_SETTINGS_URL,
        () => HttpResponse.json(EarlyRatingsUserSettingsResponseMock),
      ),
    );
    const [movie] = movies(1);
    if (!movie) throw new Error('no movie');
    serve({
      shows: json([]),
      movies: json([{ ...movie, movie: { ...movie.movie, released: null } }]),
    });
    const { movies: moviesRegion } = await renderRegions();

    await within(moviesRegion).findByRole('button', {
      name: 'Add or remove "Movie 1" from lists',
    });

    expect(moviesRegion.querySelector('.trakt-community-rating'))
      .toHaveTextContent('72%');
  });

  it('should leave a compact gap under each help line', async () => {
    const { shows, movies } = await renderRegions();

    expect(
      [shows, movies].map((region) =>
        region.querySelector('.trakt-section-header')?.getAttribute(
          'data-help-text-gap',
        )
      ),
    ).toEqual(['compact', 'compact']);
  });

  it('should drop the gap above each card on phones', async () => {
    const { shows, movies } = await renderRegions();
    await readyCells(shows, 1);
    await readyCells(movies, 1);

    expect(
      [shows, movies].map((region) =>
        region.querySelector('.trakt-row-reveal-grid')?.getAttribute(
          'data-phone-cell-gap',
        )
      ),
    ).toEqual(['none', 'none']);
  });

  it('should link each column to its recommendations page by a name holding its visible text', async () => {
    const { shows, movies } = await renderRegions();

    const showsLink = within(shows).getByRole('link', {
      name: 'More show recommendations',
    });
    const moviesLink = within(movies).getByRole('link', {
      name: 'More movie recommendations',
    });
    expect(showsLink).toHaveAttribute('href', '/shows/recommendations');
    expect(moviesLink).toHaveAttribute('href', '/movies/recommendations');
    expect(showsLink).toHaveTextContent('More');
    expect(moviesLink).toHaveTextContent('More');
  });

  it('should open two rows of three in each column at first', async () => {
    serve({ shows: json(shows(12)), movies: json(movies(12)) });
    const { shows: showsRegion, movies: moviesRegion } = await renderRegions();
    await readyCells(showsRegion, 12);
    await readyCells(moviesRegion, 12);

    expect(openCells(showsRegion)).toHaveLength(6);
    expect(openCells(moviesRegion)).toHaveLength(6);
  });

  it('should step both columns with the one navigator under them', async () => {
    serve({ shows: json(shows(12)), movies: json(movies(12)) });
    const { shows: showsRegion, movies: moviesRegion } = await renderRegions();
    await readyCells(showsRegion, 12);
    await readyCells(moviesRegion, 12);
    await waitFor(() => expect(sharedButton('more')).toBeDefined());

    await clickShared('more');
    expect(openCells(showsRegion)).toHaveLength(9);
    expect(openCells(moviesRegion)).toHaveLength(9);

    await clickShared('less');
    await clickShared('less');
    expect(openCells(showsRegion)).toHaveLength(3);
    expect(openCells(moviesRegion)).toHaveLength(3);
    expect(sharedButton('less')).toBeUndefined();
  });

  it('should step from the longer column when the columns differ in length', async () => {
    serve({ shows: json(shows(2)), movies: json(movies(12)) });
    const { shows: showsRegion, movies: moviesRegion } = await renderRegions();
    await readyCells(showsRegion, 2);
    await readyCells(moviesRegion, 12);
    await waitFor(() => expect(sharedButton('less')).toBeDefined());

    await clickShared('more');
    await clickShared('more');
    expect(openCells(moviesRegion)).toHaveLength(12);
    expect(openCells(showsRegion)).toHaveLength(2);
    expect(sharedButton('more')).toBeUndefined();

    await clickShared('less');
    expect(openCells(moviesRegion)).toHaveLength(9);
    expect(openCells(showsRegion)).toHaveLength(2);
  });

  it('should step the movies while the shows column is empty', async () => {
    serve({ shows: json([]), movies: json(movies(12)) });
    const { shows: showsRegion, movies: moviesRegion } = await renderRegions();
    await within(showsRegion).findByText(
      'No recommendations yet. Rate a few things to get some.',
    );
    await readyCells(moviesRegion, 12);
    await waitFor(() => expect(sharedButton('more')).toBeDefined());

    await clickShared('more');

    expect(openCells(moviesRegion)).toHaveLength(9);
  });

  it('should step the shows while the movies column failed', async () => {
    serve({
      shows: json(shows(12)),
      movies: () => new HttpResponse(null, { status: 500 }),
    });
    const { shows: showsRegion, movies: moviesRegion } = await renderRegions();
    expect(
      await within(moviesRegion).findByRole('button', { name: 'Retry' }),
    ).toBeVisible();
    await readyCells(showsRegion, 12);
    await waitFor(() => expect(sharedButton('more')).toBeDefined());

    await clickShared('more');

    expect(openCells(showsRegion)).toHaveLength(9);
  });

  it('should render no navigator while neither column has items', async () => {
    serve({ shows: json([]), movies: json([]) });
    const { container, shows: showsRegion, movies: moviesRegion } =
      await renderRegions();
    await within(showsRegion).findByText(
      'No recommendations yet. Rate a few things to get some.',
    );
    await within(moviesRegion).findByText(
      'No recommendations yet. Rate a few things to get some.',
    );

    expect(container.querySelector('.trakt-load-more')).toBeNull();
  });

  it.each(REMOVALS)(
    'should hand the focus to the shows section when the shared navigator leaves, where removal $removal',
    async ({ emulate }) => {
      const refetch = holdResponse(() => HttpResponse.json(movies(2)));
      const answers = [json(movies(4)), refetch.answer];
      serve({
        shows: json([]),
        movies: () => (answers.shift() ?? refetch.answer)(),
      });
      const { shows: showsRegion, movies: moviesRegion } =
        await renderRegions();
      await readyCells(moviesRegion, 4);
      const watch = await within(moviesRegion).findByRole('button', {
        name: 'Mark "Movie 1" as watched',
      });
      await waitFor(() =>
        expect(watch).toHaveAttribute('aria-disabled', 'false')
      );
      await userEvent.click(watch);
      await refetch.requested;
      emulate();

      const less = sharedButton('less');
      if (!less) throw new Error('no shared less');
      less.focus();
      refetch.release();

      await waitFor(() => expect(less.isConnected).toBe(false));
      expect(document.activeElement).toBe(showsRegion);
    },
  );

  it.each(REMOVALS)(
    'should hand the focus to the shows section when neither column is ready, where removal $removal',
    async ({ emulate }) => {
      const refetch = holdResponse(() => HttpResponse.json([]));
      const answers = [json(movies(4)), refetch.answer];
      serve({
        shows: json([]),
        movies: () => (answers.shift() ?? refetch.answer)(),
      });
      const { shows: showsRegion, movies: moviesRegion } =
        await renderRegions();
      await readyCells(moviesRegion, 4);
      const watch = await within(moviesRegion).findByRole('button', {
        name: 'Mark "Movie 1" as watched',
      });
      await waitFor(() =>
        expect(watch).toHaveAttribute('aria-disabled', 'false')
      );
      await userEvent.click(watch);
      await refetch.requested;
      emulate();

      const less = sharedButton('less');
      if (!less) throw new Error('no shared less');
      less.focus();
      refetch.release();

      await waitFor(() => expect(less.isConnected).toBe(false));
      expect(document.activeElement).toBe(showsRegion);
    },
  );

  describe('on phones', () => {
    beforeEach(() => {
      setLayout('mobile');
    });

    it("should step both columns by two cards from either column's navigator", async () => {
      serve({ shows: json(shows(12)), movies: json(movies(12)) });
      const { shows: showsRegion, movies: moviesRegion } =
        await renderRegions();
      await readyCells(showsRegion, 12);
      await readyCells(moviesRegion, 12);
      expect(openCells(showsRegion)).toHaveLength(4);
      await waitFor(() =>
        expect(phoneButton(moviesRegion, 'more')).not.toBeNull()
      );
      expect(sharedButton('more')).toBeUndefined();

      const showsMore = phoneButton(showsRegion, 'more');
      if (!showsMore) throw new Error('no shows more');
      await userEvent.click(showsMore);
      expect(openCells(showsRegion)).toHaveLength(6);
      expect(openCells(moviesRegion)).toHaveLength(6);

      const moviesLess = phoneButton(moviesRegion, 'less');
      if (!moviesLess) throw new Error('no movies less');
      await userEvent.click(moviesLess);
      expect(openCells(showsRegion)).toHaveLength(4);
      expect(openCells(moviesRegion)).toHaveLength(4);
    });

    it("should step the longer column by one row from the shorter column's navigator", async () => {
      const store = await renderStore(() =>
        useRowCount({ key: 'recommendations', rowMax: 4, defaultCount: 2 })
      );
      store.setRowCount(4);
      cleanup();
      serve({ shows: json(shows(4)), movies: json(movies(12)) });
      const { shows: showsRegion, movies: moviesRegion } =
        await renderRegions();
      await readyCells(showsRegion, 4);
      await readyCells(moviesRegion, 12);
      expect(openCells(moviesRegion)).toHaveLength(8);
      await waitFor(() =>
        expect(phoneButton(showsRegion, 'less')).not.toBeNull()
      );

      const showsLess = phoneButton(showsRegion, 'less');
      if (!showsLess) throw new Error('no shows less');
      await userEvent.click(showsLess);

      expect(openCells(moviesRegion)).toHaveLength(6);
      expect(openCells(showsRegion)).toHaveLength(4);
    });

    it('should offer the same controls under both columns', async () => {
      serve({ shows: json(shows(4)), movies: json(movies(12)) });
      const { shows: showsRegion, movies: moviesRegion } =
        await renderRegions();
      await readyCells(showsRegion, 4);
      await readyCells(moviesRegion, 12);
      await waitFor(() => expect(phoneControls(showsRegion)).toHaveLength(2));

      expect(phoneControls(showsRegion)).toEqual(['less', 'more']);
      expect(phoneControls(moviesRegion)).toEqual(['less', 'more']);
    });

    // The room under a phone navigator is CSS keyed on these marks; the
    // shared navigator overhangs the section, so the section is never marked.
    it('should give a navigator and its room only to each column that shows cards', async () => {
      serve({ shows: json([]), movies: json(movies(12)) });
      const { container, shows: showsRegion, movies: moviesRegion } =
        await renderRegions();
      await within(showsRegion).findByText(
        'No recommendations yet. Rate a few things to get some.',
      );
      await readyCells(moviesRegion, 12);
      await waitFor(() =>
        expect(phoneButton(moviesRegion, 'more')).not.toBeNull()
      );

      expect(phoneControls(showsRegion)).toEqual([]);
      expect(
        [showsRegion, moviesRegion].map((region) =>
          columnOf(region).classList.contains('has-navigator')
        ),
      ).toEqual([false, true]);
      expect(container.querySelector('.trakt-recommendations-section'))
        .not.toHaveClass('has-navigator');
    });

    it.each(REMOVALS)(
      'should keep the focus in a phone navigator whose control leaves, where removal $removal',
      async ({ emulate }) => {
        serve({ shows: json(shows(12)), movies: json(movies(12)) });
        const { shows: showsRegion, movies: moviesRegion } =
          await renderRegions();
        await readyCells(showsRegion, 12);
        await readyCells(moviesRegion, 12);
        await waitFor(() =>
          expect(phoneButton(showsRegion, 'less')).not.toBeNull()
        );
        emulate();

        phoneButton(showsRegion, 'less')?.focus();
        await userEvent.keyboard('{Enter}');

        expect(openCells(moviesRegion)).toHaveLength(2);
        expect(phoneButton(showsRegion, 'less')).toBeNull();
        expect(document.activeElement).toBe(phoneButton(showsRegion, 'more'));
      },
    );

    it.each(REMOVALS)(
      "should hand the focus to the column's section when its phone navigator leaves, where removal $removal",
      async ({ emulate }) => {
        const refetch = holdResponse(() => HttpResponse.json(movies(2)));
        const answers = [json(movies(4)), refetch.answer];
        serve({
          shows: json([]),
          movies: () => (answers.shift() ?? refetch.answer)(),
        });
        const { movies: moviesRegion } = await renderRegions();
        await readyCells(moviesRegion, 4);
        const watch = await within(moviesRegion).findByRole('button', {
          name: 'Mark "Movie 1" as watched',
        });
        await waitFor(() =>
          expect(watch).toHaveAttribute('aria-disabled', 'false')
        );
        await userEvent.click(watch);
        await refetch.requested;
        emulate();

        const less = phoneButton(moviesRegion, 'less');
        if (!less) throw new Error('no movies less');
        less.focus();
        refetch.release();

        await waitFor(() => expect(less.isConnected).toBe(false));
        expect(document.activeElement).toBe(moviesRegion);
      },
    );
  });

  describe('hide', () => {
    it('should give each card a Hide row with a flipped glyph, named for its title', async () => {
      serve({ shows: json(shows(1)), movies: json(movies(1)) });
      const { shows: showsRegion, movies: moviesRegion } =
        await renderRegions();
      await readyCells(showsRegion, 1);
      await readyCells(moviesRegion, 1);

      const hide = hideButton(showsRegion, 'Show 1');

      expect(hide).toHaveTextContent('Hide');
      expect(hide.closest('h4')).not.toBeNull();
      expect(hide.querySelector('svg')).toHaveClass(
        'tabler-icon-ban',
        'trakt-icon-mirrored',
      );
      expect(hideButton(moviesRegion, 'Movie 1')).toBeVisible();
    });

    it('should remove the card at once, before the hide lands', async () => {
      const request = holdMovieHide('movie-1');
      serve({ shows: json([]), movies: json(movies(2)) });
      const { movies: moviesRegion } = await renderRegions();
      await readyCells(moviesRegion, 2);

      await userEvent.click(hideButton(moviesRegion, 'Movie 1'));
      await request.requested;

      expect(titles(moviesRegion)).toEqual(['Movie 2']);
    });

    it('should render the refetch after the hide without the card', async () => {
      // Ids unchanged, so only the new title tells the refetch has landed.
      const refetched = movies(2).map((entry) =>
        entry.movie.ids.slug === 'movie-2'
          ? { ...entry, movie: { ...entry.movie, title: 'Movie 2, refetched' } }
          : entry
      );
      const refetch = holdResponse(() => HttpResponse.json(refetched));
      const answers = [json(movies(2)), refetch.answer];
      serve({
        shows: json([]),
        movies: () => (answers.shift() ?? refetch.answer)(),
      });
      const { movies: moviesRegion } = await renderRegions();
      await readyCells(moviesRegion, 2);

      await userEvent.click(hideButton(moviesRegion, 'Movie 1'));
      await refetch.requested;
      refetch.release();

      await waitFor(() =>
        expect(titles(moviesRegion)).toContain('Movie 2, refetched')
      );
      expect(titles(moviesRegion)).toEqual(['Movie 2, refetched']);
    });

    it('should bring the card back and show the error toast when the hide fails', async () => {
      const request = holdMovieHide('movie-1', 500);
      serve({ shows: json([]), movies: json(movies(2)) });
      const { movies: moviesRegion } = await renderRegions();
      await readyCells(moviesRegion, 2);

      await userEvent.click(hideButton(moviesRegion, 'Movie 1'));
      await request.requested;
      request.release();

      expect(
        await within(screen.getByRole('status')).findByText(
          "Couldn't save. Try again.",
        ),
      ).toBeVisible();
      await waitFor(() =>
        expect(titles(moviesRegion)).toEqual(['Movie 1', 'Movie 2'])
      );
    });

    it('should leave a title hidden before an unmount out of the next mount', async () => {
      const request = holdMovieHide('movie-1');
      serve({ shows: json([]), movies: json(movies(2)) });
      const first = await renderRegions();
      await readyCells(first.movies, 2);
      await userEvent.click(hideButton(first.movies, 'Movie 1'));
      await request.requested;
      request.release();

      cleanup();
      const { movies: moviesRegion } = await renderRegions();
      await readyCells(moviesRegion, 1);

      expect(titles(moviesRegion)).toEqual(['Movie 2']);
    });

    it.each(REMOVALS)(
      'should hand the focus to the column section when the hidden card leaves, where removal $removal',
      async ({ emulate }) => {
        holdMovieHide('movie-1');
        serve({ shows: json(shows(1)), movies: json(movies(2)) });
        const { movies: moviesRegion } = await renderRegions();
        await readyCells(moviesRegion, 2);
        emulate();

        const hide = hideButton(moviesRegion, 'Movie 1');
        hide.focus();
        await userEvent.keyboard('{Enter}');

        await waitFor(() => expect(hide.isConnected).toBe(false));
        expect(document.activeElement).toBe(moviesRegion);
      },
    );
  });
});
