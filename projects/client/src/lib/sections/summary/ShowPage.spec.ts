import { WELL_KNOWN_MEDIA_QUERY } from '$lib/stores/css/WELL_KNOWN_MEDIA_QUERY.ts';
import { DEVS_SUMMARY_URL } from '$mocks/data/shows/DEVS_SUMMARY_URL.ts';
import { SILO_LAST_EPISODE_URL } from '$mocks/data/shows/SILO_LAST_EPISODE_URL.ts';
import { ShowDevsResponseMock } from '$mocks/data/summary/shows/devs/ShowDevsResponseMock.ts';
import { ShowSiloResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloResponseMock.ts';
import { server } from '$mocks/server.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { fakeLayouts } from '$test/beds/css/fakeLayouts.ts';
import { stubOverflow } from '$test/beds/layout/stubOverflow.ts';
import { notFound } from '$test/beds/request/notFound.ts';
import { stubScrollIntoView } from '$test/beds/scroll/stubScrollIntoView.ts';
import { openAt } from '$test/beds/url/openAt.ts';
import { screen, waitFor, within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import ShowPage from './ShowPage.svelte';

const setLayout = fakeLayouts({
  desktop: WELL_KNOWN_MEDIA_QUERY.desktop,
  mobile: WELL_KNOWN_MEDIA_QUERY.mobile,
});

const SILO_SLUG = ShowSiloResponseMock.ids.slug;
const DEVS_SLUG = ShowDevsResponseMock.ids.slug;

function renderPage(slug = SILO_SLUG) {
  return renderComponent(ShowPage, { props: { slug } });
}

// Only the summary is served; the rest of its reads fail at once.
function serveDevs() {
  server.use(
    http.get(
      DEVS_SUMMARY_URL,
      () => HttpResponse.json(ShowDevsResponseMock),
    ),
    http.get(`${DEVS_SUMMARY_URL}/*`, notFound),
  );
}

describe('component: ShowPage', () => {
  describe('the actors', () => {
    it('should follow Recent Episodes with the Actors section in the sidebar', async () => {
      setLayout('desktop');
      openAt(`/shows/${SILO_SLUG}`);
      const { container } = renderPage();

      expect(await screen.findByRole('link', { name: 'Actors' }))
        .toHaveAttribute('href', '#actors');
      expect(
        [...container.querySelectorAll('section[id]')].map(({ id }) => id),
      ).toEqual([
        'overview',
        'recent-episodes',
        'actors',
        'seasons',
        'comments',
        'lists',
      ]);
    });

    it('should show the series regulars beside the guest stars', async () => {
      setLayout('desktop');
      openAt(`/shows/${SILO_SLUG}`);
      renderPage();

      const block = await screen.findByRole('region', { name: 'Actors' });

      expect(
        (await within(block).findAllByRole('tab')).map((tab) =>
          tab.textContent?.trim()
        ),
      ).toEqual(['Series Regulars 13', 'Guest Stars 2']);
    });

    it('should land on the Actors section when the URL opens on it', async () => {
      setLayout('desktop');
      openAt(`/shows/${SILO_SLUG}#actors`);
      const scroll = stubScrollIntoView();
      const { container } = renderPage();

      await screen.findByRole('region', { name: 'Actors' });

      expect(scroll.mock.contexts.at(0)).toBe(
        container.querySelector('#actors'),
      );
    });
  });

  it('should drop the Recent Episodes section and its sidebar link when nothing has aired', async () => {
    setLayout('desktop');
    openAt(`/shows/${SILO_SLUG}`);
    server.use(
      http.get(
        SILO_LAST_EPISODE_URL,
        () => new HttpResponse(null, { status: 204 }),
      ),
    );
    const { container } = renderPage();
    await screen.findByRole('link', { name: 'Actors' });

    await waitFor(() =>
      expect(container.querySelector('section#recent-episodes')).toBeNull()
    );
    expect(screen.queryByRole('link', { name: 'Recent Episodes' }))
      .toBeNull();
  });

  // The next show's summary is in the cache, as a navigation's load leaves it.
  it("should start the next show's overview clamped", async () => {
    setLayout('desktop');
    openAt(`/shows/${SILO_SLUG}`);
    stubOverflow();
    serveDevs();
    const { rerender } = renderPage(DEVS_SLUG);
    await screen.findByText(ShowDevsResponseMock.overview ?? '');

    await rerender({ slug: SILO_SLUG });
    await screen.findByText(ShowSiloResponseMock.overview ?? '');
    await userEvent.click(
      await screen.findByRole('button', { name: 'Read more' }),
    );
    await rerender({ slug: DEVS_SLUG });
    await screen.findByText(ShowDevsResponseMock.overview ?? '');

    expect(await screen.findByRole('button', { name: 'Read more' }))
      .toHaveAttribute('aria-expanded', 'false');
  });
});
