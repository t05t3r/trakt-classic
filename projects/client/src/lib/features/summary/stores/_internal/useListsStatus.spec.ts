import type { ListsType } from '$lib/requests/models/ListsType.ts';
import { movieListsQuery } from '$lib/requests/queries/movies/movieListsQuery.ts';
import { OfficialListsMappedMock } from '$mocks/data/lists/mapped/OfficialListsMappedMock.ts';
import { HERETIC_OFFICIAL_LISTS_URL } from '$mocks/data/movies/HERETIC_OFFICIAL_LISTS_URL.ts';
import { HERETIC_PERSONAL_LISTS_URL } from '$mocks/data/movies/HERETIC_PERSONAL_LISTS_URL.ts';
import { HereticListsMappedMock } from '$mocks/data/summary/movies/heretic/mapped/HereticListsMappedMock.ts';
import { MovieHereticMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticMappedMock.ts';
import { server } from '$mocks/server.ts';
import { kindsOf } from '$test/beds/query/kindsOf.ts';
import { nextOf } from '$test/beds/query/nextOf.ts';
import { useWaitForLateRequests } from '$test/beds/query/useWaitForLateRequests.ts';
import { useWaitForQueriesIdle } from '$test/beds/query/useWaitForQueriesIdle.ts';
import { captureRequests } from '$test/beds/request/captureRequests.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { notFound } from '$test/beds/request/notFound.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { valueObservable } from '$test/beds/store/valueObservable.ts';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { useListsStatus } from './useListsStatus.ts';

const listsQuery = (type: ListsType) =>
  movieListsQuery({ slug: MovieHereticMappedMock.slug, type });

async function renderListsStatus() {
  const { status, waitForQueriesIdle, waitForLateRequests } = await renderStore(
    () => ({
      status: useListsStatus((type) => valueObservable(listsQuery(type))),
      waitForQueriesIdle: useWaitForQueriesIdle(),
      waitForLateRequests: useWaitForLateRequests(),
    }),
  );

  return {
    status,
    waitForLateRequests,
    waitForSettled: (type: ListsType) =>
      waitForQueriesIdle({ queryKey: listsQuery(type).queryKey }),
  };
}

const serveNoLists = (url: string) =>
  server.use(http.get(url, () => HttpResponse.json([])));

const serveFailure = (url: string) => server.use(http.get(url, notFound));

describe('useListsStatus', () => {
  it('should read as loading while the official lists load', async () => {
    holdRequest({ method: 'get', url: HERETIC_OFFICIAL_LISTS_URL });
    const { status, waitForSettled } = await renderListsStatus();
    const kinds = kindsOf(status);

    await waitForSettled('personal');

    expect(kinds).toEqual(['loading']);
  });

  it('should read as loading while the personal lists load, even when the official ones failed', async () => {
    serveFailure(HERETIC_OFFICIAL_LISTS_URL);
    holdRequest({ method: 'get', url: HERETIC_PERSONAL_LISTS_URL });
    const { status, waitForSettled } = await renderListsStatus();
    const kinds = kindsOf(status);

    await waitForSettled('official');

    expect(kinds).toEqual(['loading']);
  });

  it('should read as error when either read failed, retrying only the failed read', async () => {
    serveFailure(HERETIC_PERSONAL_LISTS_URL);
    const { status, waitForLateRequests } = await renderListsStatus();
    const failed = await nextOf(status, 'error');
    const refetch = holdRequest({
      method: 'get',
      url: HERETIC_PERSONAL_LISTS_URL,
    });

    const requests = await captureRequests(async () => {
      failed.retry();
      await refetch.requested;
      refetch.release();
      await waitForLateRequests();
    });

    expect(requests).toEqual([
      `GET ${new URL(HERETIC_PERSONAL_LISTS_URL).pathname}`,
    ]);
  });

  it('should retry each read that failed', async () => {
    serveFailure(HERETIC_OFFICIAL_LISTS_URL);
    serveFailure(HERETIC_PERSONAL_LISTS_URL);
    const { status, waitForLateRequests } = await renderListsStatus();
    const failed = await nextOf(status, 'error');
    const officialRefetch = holdRequest({
      method: 'get',
      url: HERETIC_OFFICIAL_LISTS_URL,
    });
    const personalRefetch = holdRequest({
      method: 'get',
      url: HERETIC_PERSONAL_LISTS_URL,
    });

    failed.retry();
    await officialRefetch.requested;
    await personalRefetch.requested;
    officialRefetch.release();
    personalRefetch.release();
    await waitForLateRequests();
  });

  it('should read as empty only when both reads are empty', async () => {
    serveNoLists(HERETIC_OFFICIAL_LISTS_URL);
    serveNoLists(HERETIC_PERSONAL_LISTS_URL);
    const { status } = await renderListsStatus();

    expect(await nextOf(status, 'empty')).toEqual({ kind: 'empty' });
  });

  it('should read the official lists, then the personal ones', async () => {
    const { status } = await renderListsStatus();

    const ready = await nextOf(status, 'ready');

    expect(ready.data).toEqual([
      ...OfficialListsMappedMock,
      ...HereticListsMappedMock,
    ]);
  });

  it('should read the lists of one read when the other is empty', async () => {
    serveNoLists(HERETIC_OFFICIAL_LISTS_URL);
    const { status } = await renderListsStatus();

    const ready = await nextOf(status, 'ready');

    expect(ready.data).toEqual(HereticListsMappedMock);
  });
});
