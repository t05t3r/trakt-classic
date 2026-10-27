import { WELL_KNOWN_MEDIA_QUERY } from '$lib/stores/css/WELL_KNOWN_MEDIA_QUERY.ts';
import { SYNC_RATINGS_URL } from '$mocks/data/sync/SYNC_RATINGS_URL.ts';
import { MovieMatrixResponseMock } from '$mocks/data/summary/movies/matrix/MovieMatrixResponseMock.ts';
import { MovieHereticResponseMock } from '$mocks/data/summary/movies/heretic/response/MovieHereticResponseMock.ts';
import { server } from '$mocks/server.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { fakeLayouts } from '$test/beds/css/fakeLayouts.ts';
import { stubOverflow } from '$test/beds/layout/stubOverflow.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { holdResponse } from '$test/beds/request/holdResponse.ts';
import { notFound } from '$test/beds/request/notFound.ts';
import { screen, waitFor, within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import MoviePage from './MoviePage.svelte';

const setLayout = fakeLayouts({
  desktop: WELL_KNOWN_MEDIA_QUERY.desktop,
  mobile: WELL_KNOWN_MEDIA_QUERY.mobile,
});

const HERETIC_SLUG = MovieHereticResponseMock.ids.slug;
const MATRIX_SLUG = MovieMatrixResponseMock.ids.slug;

const cornerNames = () =>
  screen.queryAllByRole('img', { name: /^Your rating/ }).map((corner) =>
    corner.getAttribute('aria-label')
  );

function renderPage(slug = HERETIC_SLUG) {
  return renderComponent(MoviePage, { props: { slug } });
}

// Only the summary is served; the rest of its reads fail at once.
function serveMatrix() {
  server.use(
    http.get(
      `http://localhost/movies/${MATRIX_SLUG}`,
      () => HttpResponse.json(MovieMatrixResponseMock),
    ),
    http.get(`http://localhost/movies/${MATRIX_SLUG}/*`, notFound),
  );
}

describe('component: MoviePage', () => {
  describe('the user rating', () => {
    it('should show a picked rating in the slot and both poster corners', async () => {
      setLayout('desktop');
      stubClientRects();
      const write = holdResponse(() => new HttpResponse(null, { status: 201 }));
      server.use(http.post(SYNC_RATINGS_URL, write.answer));
      renderPage();
      const slot = await screen.findByRole('button', {
        name: '10 Totally Ninja!',
      });
      await waitFor(() =>
        expect(cornerNames()).toEqual(['Your rating: 10', 'Your rating: 10'])
      );

      await userEvent.click(slot);
      await userEvent.click(
        await screen.findByRole('button', { name: '8 hearts, Great' }),
      );

      await write.requested;
      expect(screen.getByRole('button', { name: '8 Great' })).toHaveFocus();
      expect(cornerNames()).toEqual(['Your rating: 8', 'Your rating: 8']);
    });
  });

  describe('the actors', () => {
    it('should follow the overview with the Actors section in the sidebar', async () => {
      setLayout('desktop');
      const { container } = renderPage();

      expect(await screen.findByRole('link', { name: 'Actors' }))
        .toHaveAttribute('href', '#actors');
      expect(
        [...container.querySelectorAll('section[id]')].map(({ id }) => id),
      ).toEqual(['overview', 'actors', 'comments', 'lists']);
    });

    it('should show the cast in one Cast tab', async () => {
      setLayout('desktop');
      renderPage();

      const block = await screen.findByRole('region', { name: 'Actors' });

      expect(
        await within(block).findByRole('tab', { selected: true }),
      ).toHaveTextContent('Cast 15');
      expect(within(block).getAllByRole('tab')).toHaveLength(1);
    });
  });

  // The next movie's summary is in the cache, as a navigation's load leaves it.
  it("should start the next movie's overview clamped", async () => {
    setLayout('desktop');
    stubOverflow();
    serveMatrix();
    const { rerender } = renderPage(MATRIX_SLUG);
    await screen.findByText(MovieMatrixResponseMock.overview ?? '');

    await rerender({ slug: HERETIC_SLUG });
    await screen.findByText(MovieHereticResponseMock.overview ?? '');
    await userEvent.click(
      await screen.findByRole('button', { name: 'Read more' }),
    );
    await rerender({ slug: MATRIX_SLUG });
    await screen.findByText(MovieMatrixResponseMock.overview ?? '');

    expect(await screen.findByRole('button', { name: 'Read more' }))
      .toHaveAttribute('aria-expanded', 'false');
  });

  describe('the lists block', () => {
    it('should follow the comments, under the Lists entry with its count', async () => {
      setLayout('desktop');
      const { container } = renderComponent(MoviePage, {
        props: { slug: MovieHereticResponseMock.ids.slug },
      });

      const entry = await screen.findByRole('link', { name: '14,650 Lists' });

      expect(entry).toHaveAttribute('href', '#lists');
      expect(
        [...container.querySelectorAll('section[id]')].map(({ id }) => id),
      ).toEqual(['overview', 'actors', 'comments', 'lists']);
    });

    it('should show the official lists, then the personal ones, under #lists', async () => {
      setLayout('desktop');
      renderComponent(MoviePage, {
        props: { slug: MovieHereticResponseMock.ids.slug },
      });
      const block = await screen.findByRole('region', { name: 'Lists' });

      const names = await within(block).findAllByRole('heading', { level: 3 });

      expect(block.closest('section#lists')).not.toBeNull();
      expect(names.map(({ textContent }) => textContent?.trim())).toEqual([
        'Official list',
        'Heretics only',
      ]);
    });
  });
});
