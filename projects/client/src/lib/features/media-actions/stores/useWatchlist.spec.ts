import { useUser } from '$lib/features/auth/stores/useUser.ts';
import { ShowDevsResponseMock } from '$mocks/data/summary/shows/devs/ShowDevsResponseMock.ts';
import { DEVS } from '$mocks/data/media-actions/DEVS.ts';
import { MATRIX } from '$mocks/data/media-actions/MATRIX.ts';
import { SILO } from '$mocks/data/media-actions/SILO.ts';
import { SILO_SEASON } from '$mocks/data/media-actions/SILO_SEASON.ts';
import { WatchlistAllResponseMock } from '$mocks/data/sync/response/WatchlistAllResponseMock.ts';
import { SYNC_WATCHLIST_REMOVE_URL } from '$mocks/data/sync/SYNC_WATCHLIST_REMOVE_URL.ts';
import { SYNC_WATCHLIST_URL } from '$mocks/data/sync/SYNC_WATCHLIST_URL.ts';
import { WATCHLIST_URL } from '$mocks/data/sync/WATCHLIST_URL.ts';
import { server } from '$mocks/server.ts';
import { createRenderBound } from '$test/beds/media-actions/createRenderBound.ts';
import { listedAtOf } from '$test/beds/media-actions/listedAtOf.ts';
import { useWaitForQueriesIdle } from '$test/beds/query/useWaitForQueriesIdle.ts';
import { captureRequests } from '$test/beds/request/captureRequests.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { holdResponse } from '$test/beds/request/holdResponse.ts';
import { pagedResponse } from '$test/beds/request/pagedResponse.ts';
import { serveTwoPages } from '$test/beds/request/serveTwoPages.ts';
import { collectDistinctStates } from '$test/beds/store/collectDistinctStates.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { screen, within } from '@testing-library/svelte';
import { http, HttpResponse } from 'msw';
import { filter, firstValueFrom, skip } from 'rxjs';
import { describe, expect, it, onTestFinished } from 'vitest';
import { useWatchlist } from './useWatchlist.ts';

const UNLISTED_SEASON = { type: 'season', id: 999_998 } as const;
const SILO_EPISODE = { type: 'episode', id: 5165667 } as const;
const UNLISTED_EPISODE = { type: 'episode', id: 999_999 } as const;

const renderBound = createRenderBound({
  store: useWatchlist,
  flag: (store) => store.isWatchlisted,
  snapshot: (user) => user.watchlist,
});

describe('store: useWatchlist', () => {
  it('should read a watchlisted movie from the watchlist snapshot', async () => {
    const { isWatchlisted } = await renderBound(MATRIX);

    expect(await firstValueFrom(isWatchlisted)).toBe(true);
  });

  it('should read a watchlisted show from the watchlist snapshot', async () => {
    const { isWatchlisted } = await renderBound(SILO);

    expect(await firstValueFrom(isWatchlisted)).toBe(true);
  });

  it('should read a watchlisted season from the watchlist snapshot', async () => {
    const { isWatchlisted } = await renderBound(SILO_SEASON);

    expect(await firstValueFrom(isWatchlisted)).toBe(true);
  });

  it('should read a watchlisted episode from the watchlist snapshot', async () => {
    const { isWatchlisted } = await renderBound(SILO_EPISODE);

    expect(await firstValueFrom(isWatchlisted)).toBe(true);
  });

  it('should read the date a Target was watchlisted', async () => {
    const { listedAt } = await renderBound(MATRIX);

    expect(await firstValueFrom(listedAt)).toEqual(listedAtOf(MATRIX));
  });

  it('should read no date for a Target off the watchlist', async () => {
    const { listedAt } = await renderBound(DEVS);

    expect(await firstValueFrom(listedAt)).toBeUndefined();
  });

  it('should show a show off the watchlist as not watchlisted', async () => {
    const { isWatchlisted } = await renderBound(DEVS);

    expect(await firstValueFrom(isWatchlisted)).toBe(false);
  });

  it('should show the addition while the request is in flight, then settle', async () => {
    const { add, isWatchlisted, isUpdating } = await renderBound(DEVS);
    const inFlight: unknown[] = [];
    server.use(
      http.post(SYNC_WATCHLIST_URL, async ({ request }) => {
        inFlight.push(
          await request.json(),
          await firstValueFrom(isWatchlisted),
          await firstValueFrom(isUpdating),
        );
        return new HttpResponse(null, { status: 201 });
      }),
    );

    const requests = await captureRequests(() => add());

    expect(inFlight).toEqual([
      { shows: [{ ids: { trakt: DEVS.id } }] },
      true,
      true,
    ]);
    expect(requests).toEqual([
      'POST /sync/watchlist',
      'GET /sync/watchlist/all/rank/asc',
    ]);
    expect(await firstValueFrom(isUpdating)).toBe(false);
  });

  it('should keep an added Target on until the page it lands on loads', async () => {
    const { add, isWatchlisted } = await renderBound(DEVS);
    const states = collectDistinctStates(isWatchlisted);
    const secondPage = holdResponse(() =>
      pagedResponse({
        body: [{
          type: 'show',
          show: ShowDevsResponseMock,
          rank: 5,
          listed_at: '2024-01-05T12:00:00.000Z',
        }],
        page: 2,
        pageCount: 2,
      })
    );
    serveTwoPages({
      url: WATCHLIST_URL,
      first: WatchlistAllResponseMock,
      second: secondPage.answer,
    });

    const adding = add();
    await secondPage.requested;
    const whileLoading = await firstValueFrom(isWatchlisted);
    secondPage.release();
    await adding;

    expect(whileLoading).toBe(true);
    expect(states).toEqual([false, true]);
  });

  it('should show the removal while the request is in flight', async () => {
    const { remove, isWatchlisted } = await renderBound(MATRIX);
    const inFlight: unknown[] = [];
    server.use(
      http.post(
        SYNC_WATCHLIST_REMOVE_URL,
        async ({ request }) => {
          inFlight.push(
            await request.json(),
            await firstValueFrom(isWatchlisted),
          );
          return new HttpResponse(null, { status: 200 });
        },
      ),
    );

    await remove();

    expect(inFlight).toEqual([
      { movies: [{ ids: { trakt: MATRIX.id } }] },
      false,
    ]);
  });

  it('should add an episode with an episode body', async () => {
    const { add } = await renderBound(UNLISTED_EPISODE);
    const bodies: unknown[] = [];
    server.use(
      http.post(SYNC_WATCHLIST_URL, async ({ request }) => {
        bodies.push(await request.json());
        return new HttpResponse(null, { status: 201 });
      }),
    );

    const requests = await captureRequests(() => add());

    expect(bodies).toEqual([{ episodes: [{ ids: { trakt: 999_999 } }] }]);
    expect(requests).toEqual([
      'POST /sync/watchlist',
      'GET /sync/watchlist/all/rank/asc',
    ]);
  });

  it('should add a season with a season body', async () => {
    const { add } = await renderBound(UNLISTED_SEASON);
    const bodies: unknown[] = [];
    server.use(
      http.post(SYNC_WATCHLIST_URL, async ({ request }) => {
        bodies.push(await request.json());
        return new HttpResponse(null, { status: 201 });
      }),
    );

    const requests = await captureRequests(() => add());

    expect(bodies).toEqual([{ seasons: [{ ids: { trakt: 999_998 } }] }]);
    expect(requests).toEqual([
      'POST /sync/watchlist',
      'GET /sync/watchlist/all/rank/asc',
    ]);
  });

  it('should roll back and show the error toast when the request fails', async () => {
    server.use(
      http.post(
        SYNC_WATCHLIST_REMOVE_URL,
        () => new HttpResponse(null, { status: 500 }),
      ),
    );
    const { remove, isWatchlisted, isUpdating } = await renderBound(MATRIX);

    await remove();

    expect(await firstValueFrom(isWatchlisted)).toBe(true);
    expect(await firstValueFrom(isUpdating)).toBe(false);
    expect(
      within(screen.getByRole('status')).getByText(
        "Couldn't save. Try again.",
      ),
    ).toBeVisible();
  });

  describe('loading signal', () => {
    it('should read a Target as not known while the watchlist loads', async () => {
      holdRequest({
        method: 'get',
        url: WATCHLIST_URL,
        answer: () => pagedResponse({ body: [] }),
      });
      const { isWatchlisted } = await renderStore(() => useWatchlist(MATRIX));

      expect(await firstValueFrom(isWatchlisted)).toBeUndefined();
    });

    it('should read a Target as not known when the first page fails', async () => {
      const failed = holdRequest({
        method: 'get',
        url: WATCHLIST_URL,
        answer: () => new HttpResponse(null, { status: 500 }),
      });
      failed.release();
      const { isWatchlisted, waitForQueriesIdle } = await renderStore(() => ({
        ...useWatchlist(MATRIX),
        waitForQueriesIdle: useWaitForQueriesIdle(),
      }));
      // A bound read, so it sees the failure rather than a refetch on subscribe.
      const states = collectDistinctStates(isWatchlisted);
      await failed.requested;
      await waitForQueriesIdle();

      expect(states.at(-1)).toBeUndefined();
    });

    it('should keep the snapshot while an add grows the watchlist past one page', async () => {
      const { matrix, devs, watchlist } = await renderStore(() => ({
        matrix: useWatchlist(MATRIX),
        devs: useWatchlist(DEVS),
        watchlist: useUser().watchlist,
      }));
      const bound = watchlist.subscribe();
      onTestFinished(() => bound.unsubscribe());
      await firstValueFrom(watchlist.pipe(filter(Boolean)));
      const states = collectDistinctStates(matrix.isWatchlisted);
      const secondPage = holdResponse(() =>
        pagedResponse({ body: [], page: 2, pageCount: 2 })
      );
      serveTwoPages({
        url: WATCHLIST_URL,
        first: WatchlistAllResponseMock,
        second: secondPage.answer,
      });

      const adding = devs.add();
      await secondPage.requested;
      const whileFetching = await firstValueFrom(matrix.isWatchlisted);
      const secondPageRead = firstValueFrom(watchlist.pipe(skip(1)));
      secondPage.release();
      await secondPageRead;
      await adding;

      expect(whileFetching).toBe(true);
      expect(states).toEqual([true]);
    });

    it('should settle on the pages it has when a further page fails', async () => {
      serveTwoPages({
        url: WATCHLIST_URL,
        first: WatchlistAllResponseMock,
        second: () => new HttpResponse(null, { status: 500 }),
      });
      const { matrix, devs, watchlist } = await renderStore(() => ({
        matrix: useWatchlist(MATRIX),
        devs: useWatchlist(DEVS),
        watchlist: useUser().watchlist,
      }));

      await firstValueFrom(watchlist.pipe(filter(Boolean)));

      expect(await firstValueFrom(matrix.isWatchlisted)).toBe(true);
      expect(await firstValueFrom(devs.isWatchlisted)).toBe(false);
    });
  });
});
