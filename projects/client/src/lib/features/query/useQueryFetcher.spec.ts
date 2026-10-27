import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { showProgressQuery } from '$lib/requests/queries/shows/showProgressQuery.ts';
import { SILO_PROGRESS_URL } from '$mocks/data/shows/SILO_PROGRESS_URL.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { ShowSiloProgressMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloProgressMappedMock.ts';
import { server } from '$mocks/server.ts';
import { setNetwork } from '$test/beds/network/setNetwork.ts';
import { settleWithin } from '$test/beds/promise/settleWithin.ts';
import { useObserverApart } from '$test/beds/query/useObserverApart.ts';
import { captureRequests } from '$test/beds/request/captureRequests.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';
import { useQueryFetcher } from './useQueryFetcher.ts';

const SILO_PROGRESS = () =>
  showProgressQuery({ slug: ShowSiloMappedMock.slug });
const PROGRESS_KEY = SILO_PROGRESS().queryKey;

const renderObserved = () =>
  renderStore(() => ({
    ...useQueryFetcher(),
    ...useObserverApart(SILO_PROGRESS()),
  }));

describe('useQueryFetcher', () => {
  afterEach(() => {
    setNetwork('online');
  });

  it('should fetch a query once and resolve with its mapped data', async () => {
    const { fetch } = await renderStore(useQueryFetcher);
    const results: unknown[] = [];

    const requests = await captureRequests(async () => {
      results.push(
        await fetch(showProgressQuery({ slug: ShowSiloMappedMock.slug })),
      );
    });

    expect(requests).toEqual(['GET /shows/silo/progress/watched']);
    expect(results).toEqual([ShowSiloProgressMappedMock]);
  });

  it('should reject after its retries while the browser is offline', async () => {
    server.use(
      http.get(SILO_PROGRESS_URL, () => HttpResponse.error()),
    );
    const { fetch } = await renderStore(useQueryFetcher);
    setNetwork('offline');
    const outcomes: unknown[] = [];

    const requests = await captureRequests(async () => {
      outcomes.push(
        await settleWithin(
          fetch(showProgressQuery({ slug: ShowSiloMappedMock.slug })),
          1000,
        ),
      );
    });

    expect(outcomes).toEqual(['rejected']);
    expect(requests).toEqual(
      Array(4).fill('GET /shows/silo/progress/watched'),
    );
  });

  describe('beside an observer of the same query', () => {
    it("should read afresh rather than from the observer's cache", async () => {
      const { fetch, observe, waitForQueriesIdle } = await renderObserved();
      observe();
      await waitForQueriesIdle({ queryKey: PROGRESS_KEY });

      const requests = await captureRequests(async () => {
        await fetch(SILO_PROGRESS());
      });

      expect(requests).toEqual(['GET /shows/silo/progress/watched']);
    });

    it("should reject at once while the observer's read is paused offline", async () => {
      server.use(http.get(SILO_PROGRESS_URL, () => HttpResponse.error()));
      const { fetch, observe, waitForQueryPaused } = await renderObserved();
      setNetwork('offline');
      observe();
      await waitForQueryPaused({ queryKey: PROGRESS_KEY });

      expect(await settleWithin(fetch(SILO_PROGRESS()), 1000)).toBe(
        'rejected',
      );
    });

    it("should leave the observer's read to wait for reconnect", async () => {
      const {
        fetch,
        observe,
        invalidate,
        waitForQueriesIdle,
        waitForQueryPaused,
      } = await renderObserved();
      observe();
      await waitForQueriesIdle({ queryKey: PROGRESS_KEY });
      await fetch(SILO_PROGRESS());
      setNetwork('offline');

      void invalidate(InvalidateAction.Rewatching('show'));

      expect(
        await settleWithin(
          waitForQueryPaused({ queryKey: PROGRESS_KEY }),
          1000,
        ),
      ).toBe('resolved');
    });
  });
});
