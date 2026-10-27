import { sessionExpired } from '$lib/features/auth/sessionExpired.ts';
import { getToken, setToken } from '$lib/features/auth/token.ts';
import { RefreshResponseMock } from '$mocks/data/auth/response/RefreshResponseMock.ts';
import { EpisodeSiloResponseMock } from '$mocks/data/summary/episodes/silo/response/EpisodeSiloResponseMock.ts';
import { ShowSiloResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloResponseMock.ts';
import { MOVIE_IDS_BODY } from '$mocks/data/sync/MOVIE_IDS_BODY.ts';
import { SYNC_WATCHLIST_URL } from '$mocks/data/sync/SYNC_WATCHLIST_URL.ts';
import { server } from '$mocks/server.ts';
import { captureRequests } from '$test/beds/request/captureRequests.ts';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, rawApiFetch } from './api.ts';

describe('api', () => {
  afterEach(() => setToken(null));

  function addToWatchlist(onResponse: (response: Response) => void) {
    return api({ onResponse }).sync.watchlist.add({ body: MOVIE_IDS_BODY });
  }

  it('should hand onResponse the final response', async () => {
    server.use(
      http.post(
        SYNC_WATCHLIST_URL,
        () => HttpResponse.json({}, { status: 201 }),
      ),
    );
    const onResponse = vi.fn();

    await addToWatchlist(onResponse);

    expect(onResponse).toHaveBeenCalledOnce();
    expect(onResponse.mock.calls.at(0)?.at(0)?.status).toBe(201);
  });

  it('should hand onResponse only the retried response after a refresh', async () => {
    setToken({ value: 'rejected' });
    server.use(
      http.post(
        SYNC_WATCHLIST_URL,
        ({ request }) =>
          request.headers.get('Authorization') === 'Bearer rejected'
            ? new HttpResponse(null, { status: 401 })
            : HttpResponse.json({}, { status: 201 }),
      ),
      http.post('*/auth/refresh', () => HttpResponse.json(RefreshResponseMock)),
    );
    const onResponse = vi.fn<(response: Response) => void>();

    await addToWatchlist(onResponse);

    expect(onResponse.mock.calls.map(([response]) => response.status))
      .toEqual([201]);
  });

  it('should hand onResponse the original 401 when the refresh fails', async () => {
    setToken({ value: 'rejected' });
    server.use(
      http.post(
        SYNC_WATCHLIST_URL,
        () => new HttpResponse(null, { status: 401 }),
      ),
      http.post(
        '*/auth/refresh',
        () => new HttpResponse(null, { status: 503 }),
      ),
    );
    const onResponse = vi.fn<(response: Response) => void>();

    await addToWatchlist(onResponse);

    expect(onResponse.mock.calls.map(([response]) => response.status))
      .toEqual([401]);
  });

  it('should fire sessionExpired before onResponse sees the final 401', async () => {
    setToken({ value: 'rejected' });
    server.use(
      http.post(
        SYNC_WATCHLIST_URL,
        () => new HttpResponse(null, { status: 401 }),
      ),
      http.post(
        '*/auth/refresh',
        () => new HttpResponse(null, { status: 401 }),
      ),
    );
    const expired = { fired: false };
    const subscription = sessionExpired.subscribe(() => {
      expired.fired = true;
    });
    const seen: Array<{ status: number; expired: boolean }> = [];

    try {
      await addToWatchlist((response) => {
        seen.push({ status: response.status, expired: expired.fired });
      });
    } finally {
      subscription.unsubscribe();
    }

    expect(seen).toEqual([{ status: 401, expired: true }]);
  });

  it('should abort the request on its signal', async () => {
    const onRequest = vi.fn();
    server.use(
      http.post(SYNC_WATCHLIST_URL, () => {
        onRequest();
        return HttpResponse.json({}, { status: 201 });
      }),
    );
    const controller = new AbortController();
    controller.abort();

    await expect(
      api({ signal: controller.signal }).sync.watchlist.add({
        body: MOVIE_IDS_BODY,
      }),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(onRequest).not.toHaveBeenCalled();
  });

  it('should not abort the Session refresh on its signal', async () => {
    setToken({ value: 'rejected' });
    const controller = new AbortController();
    server.use(
      http.post(
        SYNC_WATCHLIST_URL,
        () => new HttpResponse(null, { status: 401 }),
      ),
      http.post('*/auth/refresh', () => {
        controller.abort();
        return HttpResponse.json(RefreshResponseMock);
      }),
    );

    await expect(
      api({ signal: controller.signal }).sync.watchlist.add({
        body: MOVIE_IDS_BODY,
      }),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(getToken().value).toBe(RefreshResponseMock.token);
  });

  describe('for a zero param', () => {
    const slug = ShowSiloResponseMock.ids.slug;
    const season = EpisodeSiloResponseMock.season;

    it('should keep an episode 0 in the request path', async () => {
      const path = `/shows/${slug}/seasons/${season}/episodes/0`;
      server.use(
        http.get(
          `http://localhost${path}`,
          () => HttpResponse.json(EpisodeSiloResponseMock),
        ),
      );

      const requests = await captureRequests(() =>
        api().shows.episode.summary({
          params: { id: slug, season, episode: 0 },
        })
      );

      expect(requests).toEqual([`GET ${path}`]);
    });

    it('should keep a season 0 in the request path', async () => {
      const path = `/shows/${slug}/seasons/0`;
      server.use(
        http.get(`http://localhost${path}`, () => HttpResponse.json([])),
      );

      const requests = await captureRequests(() =>
        api().shows.season.episodes({ params: { id: slug, season: 0 } })
      );

      expect(requests).toEqual([`GET ${path}`]);
    });

    it('should send a query param 0 as it is', async () => {
      const searches: string[] = [];
      server.use(
        http.get(
          `http://localhost/shows/${slug}/seasons/${season}/comments/likes`,
          ({ request }) => {
            searches.push(new URL(request.url).search);
            return HttpResponse.json([]);
          },
        ),
      );

      await api().shows.season.comments({
        params: { id: slug, season, sort: 'likes' },
        query: { page: 0, limit: 0 },
      });

      expect(searches).toEqual(['?page=0&limit=0']);
    });
  });
});

describe('rawApiFetch', () => {
  afterEach(() => setToken(null));

  function spyFetch() {
    return vi.fn(
      (_input: RequestInfo | URL, _init?: RequestInit) =>
        Promise.resolve(new Response(null, { status: 200 })),
    );
  }

  function requestHeaders(spy: ReturnType<typeof spyFetch>): Headers {
    return new Headers(spy.mock.calls[0]?.[1]?.headers);
  }

  it('should attach the Bearer token by default', async () => {
    setToken({ value: 'user-token' });
    const fetch = spyFetch();

    await rawApiFetch({
      fetch: fetch as unknown as typeof globalThis.fetch,
      path: '/x',
    });

    expect(requestHeaders(fetch).get('Authorization')).to.equal(
      'Bearer user-token',
    );
  });

  it('should send no Bearer token when authenticated is false', async () => {
    // The slurm request must never carry the signed-in user's token, so a
    // different account can never mix into an out-of-band authorized request.
    setToken({ value: 'user-token' });
    const fetch = spyFetch();

    await rawApiFetch({
      fetch: fetch as unknown as typeof globalThis.fetch,
      path: '/x',
      authenticated: false,
    });

    expect(requestHeaders(fetch).has('Authorization')).to.equal(false);
  });
});
