import { ShowDevsResponseMock } from '$mocks/data/summary/shows/devs/ShowDevsResponseMock.ts';
import { EpisodeSiloResponseMock } from '$mocks/data/summary/episodes/silo/response/EpisodeSiloResponseMock.ts';
import { ShowSiloMinimalResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloMinimalResponseMock.ts';
import { WATCHLIST_URL } from '$mocks/data/sync/WATCHLIST_URL.ts';
import { HIDE_PROGRESS_URL } from '$mocks/data/users/HIDE_PROGRESS_URL.ts';
import { HiddenSeasonsAllSiloResponseMock } from '$mocks/data/users/response/HiddenSeasonsAllSiloResponseMock.ts';
import { server } from '$mocks/server.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { serveUpNext } from '$test/beds/dashboard/serveUpNext.ts';
import { imageHrefs } from '$test/beds/media/imageHrefs.ts';
import { holdResponse } from '$test/beds/request/holdResponse.ts';
import { servePaged } from '$test/beds/request/servePaged.ts';
import { watchedProgressRow } from '$test/beds/request/watchedProgressRow.ts';
import { waitFor } from '@testing-library/svelte';
import type { UpNextResponse } from '@trakt/api';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import HeroPosterWall from './HeroPosterWall.svelte';

function shard(id: number) {
  const digits = String(id).padStart(9, '0');
  return `${digits.slice(0, 3)}/${digits.slice(3, 6)}/${digits.slice(6)}`;
}

function posterCandidate(id: number) {
  return `media.trakt.tv/images/shows/${
    shard(id)
  }/posters/thumb/p${id}.jpg.webp`;
}

// A show of its own; `withPoster: false` leaves it the Placeholder.
function upNext(id: number, withPoster = true): UpNextResponse {
  return watchedProgressRow({
    show: {
      ...ShowDevsResponseMock,
      ids: { ...ShowDevsResponseMock.ids, trakt: id, slug: `show-${id}` },
      images: {
        fanart: [],
        poster: withPoster ? [posterCandidate(id)] : [],
        logo: [],
        clearart: [],
        banner: [],
        thumb: [],
      },
    },
    lastWatchedAt: null,
    aired: 8,
    completed: 1,
    nextEpisode: EpisodeSiloResponseMock,
  });
}

function proxied(id: number) {
  return `/img/shows/${shard(id)}/posters/thumb/p${id}.jpg.webp`;
}

// The Watchlist is empty unless a test asks for the preview mock.
function renderWall(
  answer: () => Response | Promise<Response>,
  { withWatchlist = false } = {},
) {
  serveUpNext(answer);
  if (!withWatchlist) {
    server.use(http.get(WATCHLIST_URL, () => HttpResponse.json([])));
  }
  const { container } = renderComponent(HeroPosterWall, { props: {} });
  return container;
}

describe('section: HeroPosterWall', () => {
  it("should cycle Up Next's posters in order", async () => {
    const container = renderWall(() =>
      HttpResponse.json([upNext(1), upNext(2), upNext(3)])
    );

    await waitFor(() => expect(imageHrefs(container)).toHaveLength(24));
    expect(imageHrefs(container).slice(0, 7)).toEqual([
      proxied(1),
      proxied(2),
      proxied(3),
      proxied(1),
      proxied(2),
      proxied(3),
      proxied(1),
    ]);
  });

  it('should leave out the shows without a poster', async () => {
    const container = renderWall(() =>
      HttpResponse.json([upNext(1), upNext(2, false), upNext(3)])
    );

    await waitFor(() => expect(imageHrefs(container)).toHaveLength(24));
    expect(imageHrefs(container).slice(0, 3)).toEqual([
      proxied(1),
      proxied(3),
      proxied(1),
    ]);
  });

  it('should take the first 12 posters', async () => {
    const shows = Array.from({ length: 16 }, (_, index) => index + 1);
    const container = renderWall(() =>
      HttpResponse.json(shows.map((id) => upNext(id, id !== 2)))
    );

    await waitFor(() => expect(imageHrefs(container)).toHaveLength(24));
    const first12 = [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map(proxied);
    expect(imageHrefs(container)).toEqual([...first12, ...first12]);
  });

  it("should follow Up Next's posters with the Watchlist's, each item's by its type", async () => {
    const container = renderWall(
      () => HttpResponse.json([upNext(1), upNext(2)]),
      { withWatchlist: true },
    );

    await waitFor(() =>
      expect(imageHrefs(container).slice(0, 9)).toEqual([
        proxied(1),
        proxied(2),
        '/img/movies/000/259/852/posters/thumb/edaa502030.jpg.webp',
        '/img/movies/000/000/650/posters/thumb/69872078fd.jpg.webp',
        '/img/shows/000/155/534/posters/thumb/6b6d40b6de.jpg.webp',
        '/img/shows/000/170/054/posters/thumb/6c986db7d0.jpg.webp',
        '/img/seasons/000/456/019/posters/thumb/279e86a7d7.jpg.webp',
        '/img/shows/000/154/574/posters/thumb/5fea83a517.jpg.webp',
        proxied(1),
      ])
    );
  });

  it('should leave out a show with nothing watched whose next episode is in a hidden season', async () => {
    const siloId = ShowSiloMinimalResponseMock.ids.trakt;
    const silo = upNext(siloId);
    servePaged({
      url: HIDE_PROGRESS_URL,
      body: HiddenSeasonsAllSiloResponseMock,
    });
    const container = renderWall(() =>
      HttpResponse.json([
        upNext(1),
        { ...silo, progress: { ...silo.progress, completed: 0 } },
        upNext(3),
      ])
    );

    await waitFor(() => expect(imageHrefs(container)).toHaveLength(24));
    expect(imageHrefs(container).slice(0, 3)).toEqual([
      proxied(1),
      proxied(3),
      proxied(1),
    ]);
  });

  it('should render nothing while Up Next is pending and the Watchlist is empty', async () => {
    const held = holdResponse(() => HttpResponse.json([upNext(1)]));
    const container = renderWall(held.answer);

    await held.requested;
    expect(container.querySelector('svg')).toBeNull();
    held.release();
    await waitFor(() => expect(imageHrefs(container)).toHaveLength(24));
  });
});
