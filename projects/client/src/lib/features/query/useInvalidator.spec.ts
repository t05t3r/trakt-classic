import { defineQuery } from '$lib/features/query/defineQuery.ts';
import { type ApiParams, rawApiFetch } from '$lib/requests/api.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { userListItemIdsQuery } from '$lib/requests/queries/users/userListItemIdsQuery.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { time } from '$lib/utils/timing/time.ts';
import { NOOP_FN } from '$lib/utils/NOOP_FN.ts';
import { ITEMS_URL } from '$mocks/data/users/ITEMS_URL.ts';
import { LIST_ID } from '$mocks/data/users/LIST_ID.ts';
import { server } from '$mocks/server.ts';
import { setNetwork } from '$test/beds/network/setNetwork.ts';
import { NEGATIVE_CLAIM_WINDOW } from '$test/beds/promise/NEGATIVE_CLAIM_WINDOW.ts';
import { settleWithin } from '$test/beds/promise/settleWithin.ts';
import { createTestBedQuery } from '$test/beds/query/createTestBedQuery.ts';
import { useWaitForQueryFetching } from '$test/beds/query/useWaitForQueryFetching.ts';
import { useWaitForLateRequests } from '$test/beds/query/useWaitForLateRequests.ts';
import { useWaitForQueryPaused } from '$test/beds/query/useWaitForQueryPaused.ts';
import { useWaitForUnobserved } from '$test/beds/query/useWaitForUnobserved.ts';
import { waitForSuccess } from '$test/beds/query/waitForSuccess.ts';
import { failOnce } from '$test/beds/request/failOnce.ts';
import { holdResponse } from '$test/beds/request/holdResponse.ts';
import { movieListItem } from '$test/beds/request/movieListItem.ts';
import { notFound } from '$test/beds/request/notFound.ts';
import { captureRequests } from '$test/beds/request/captureRequests.ts';
import { pagedResponse } from '$test/beds/request/pagedResponse.ts';
import { servePaged } from '$test/beds/request/servePaged.ts';
import { serveTwoPages } from '$test/beds/request/serveTwoPages.ts';
import { idsOf } from '$test/beds/store/idsOf.ts';
import { readKnown } from '$test/beds/store/readKnown.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { fireAfterNavigate } from '$test/beds/url/fireAfterNavigate.ts';
import { http, HttpResponse } from 'msw';
import type { Subscription } from 'rxjs';
import { afterEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { useInvalidator } from './useInvalidator.ts';
import { useSnapshot } from './useSnapshot.ts';

const ACTION = InvalidateAction.Rated('movie');
const FIRST_PATH = '/invalidator/first';
const SECOND_PATH = '/invalidator/second';
const FIRST_URL = `http://localhost${FIRST_PATH}`;
const SECOND_URL = `http://localhost${SECOND_PATH}`;

const invalidatedQuery = (
  { key, path, ttl = null }: { key: string; path: string; ttl?: number | null },
) =>
  defineQuery({
    key,
    invalidations: [ACTION],
    dependencies: [],
    request: async ({ fetch }: ApiParams) => {
      const response = await rawApiFetch({ fetch, path });
      return { status: response.status, body: await response.json() };
    },
    mapper: (response: { body: string }) => response.body,
    schema: z.string(),
    ttl,
  });

const firstQuery = invalidatedQuery({
  key: 'invalidatorFirst',
  path: FIRST_PATH,
});
const secondQuery = invalidatedQuery({
  key: 'invalidatorSecond',
  path: SECOND_PATH,
});
// Fresh for longer than a spec runs, so only an invalidation sends a request at mount.
const lastingQuery = invalidatedQuery({
  key: 'invalidatorLasting',
  path: FIRST_PATH,
  ttl: time.hours(1),
});

const LIST_ACTION = InvalidateAction.ListedIn(LIST_ID);
const LIST_QUERY = userListItemIdsQuery({ userId: 'me', listId: LIST_ID });

// The second page waits for the spec, so the wait can be read while it loads.
function serveGrownList(second: () => Response) {
  const held = holdResponse(second);
  const requests: string[] = [];
  serveTwoPages({
    url: ITEMS_URL,
    first: [movieListItem(481)],
    second: () => {
      requests.push('second');
      return held.answer();
    },
  });

  return { requested: held.requested, release: held.release, requests };
}

function navigationRequests(
  waitForLateRequests: () => Promise<void>,
  pathIncludes: string,
): () => Promise<string[]> {
  return () =>
    captureRequests(async () => {
      fireAfterNavigate();
      await waitForLateRequests();
    }, { pathIncludes });
}

function serve(path: string, onRequest: () => Promise<void> | void) {
  server.use(
    http.get(`http://localhost${path}`, async () => {
      await onRequest();
      return HttpResponse.json(path);
    }),
  );
}

describe('useInvalidator', () => {
  const subscriptions: Subscription[] = [];

  afterEach(() => {
    subscriptions.splice(0).forEach((subscription) =>
      subscription.unsubscribe()
    );
    setNetwork('online');
  });

  async function renderSnapshot() {
    servePaged({ url: ITEMS_URL, body: [movieListItem(481)] });
    const store = await renderStore(() => ({
      ...useInvalidator(),
      waitForUnobserved: useWaitForUnobserved(),
      waitForLateRequests: useWaitForLateRequests(),
      snapshot: useSnapshot(LIST_QUERY, {
        select: idsOf,
        whileUnsettled: 'hold',
      }),
    }));
    const reads: Array<ReadonlyArray<number> | undefined> = [];
    const subscription = store.snapshot.subscribe((ids) => reads.push(ids));
    subscriptions.push(subscription);
    await readKnown(store.snapshot);
    return { ...store, reads, subscription };
  }

  it('should wait for the refetch a later invalidation starts in place of a paused one', async () => {
    const events: string[] = [];
    serve(FIRST_PATH, () => {
      events.push('fetch');
    });
    const { invalidate, waitForQueryPaused, first } = await renderStore(() => ({
      ...useInvalidator(),
      waitForQueryPaused: useWaitForQueryPaused(),
      first: createTestBedQuery(firstQuery()),
    }));
    subscriptions.push(first.subscribe());
    await waitForSuccess(first);

    setNetwork('offline');
    const earlier = invalidate(ACTION).then(() => events.push('settled'));
    await waitForQueryPaused({ queryKey: firstQuery().queryKey });
    const later = invalidate(ACTION);
    const whileOffline = await settleWithin(earlier, NEGATIVE_CLAIM_WINDOW);

    setNetwork('online');
    await Promise.all([earlier, later]);

    expect(whileOffline).toBe('pending');
    expect(events).toEqual(['fetch', 'fetch', 'settled']);
  });

  it('should wait for a paused refetch that resumes while it waits for another fetch', async () => {
    const events: string[] = [];
    const firstHold = holdResponse(() => undefined);
    const secondHold = holdResponse(() => undefined);
    serve(FIRST_PATH, NOOP_FN);
    serve(SECOND_PATH, secondHold.answer);
    const {
      invalidate,
      waitForQueryPaused,
      waitForQueryFetching,
      first,
      second,
    } = await renderStore(() => ({
      ...useInvalidator(),
      waitForQueryPaused: useWaitForQueryPaused(),
      waitForQueryFetching: useWaitForQueryFetching(),
      first: createTestBedQuery(firstQuery()),
      second: createTestBedQuery(secondQuery()),
    }));
    subscriptions.push(first.subscribe());
    await waitForSuccess(first);
    subscriptions.push(second.subscribe());
    await waitForQueryFetching({ queryKey: secondQuery().queryKey });
    serve(FIRST_PATH, () => {
      events.push('refetch');
      return firstHold.answer();
    });

    setNetwork('offline');
    const invalidation = invalidate(ACTION).then(() => events.push('settled'));
    await waitForQueryPaused({ queryKey: firstQuery().queryKey });
    setNetwork('online');
    await waitForQueryFetching({ queryKey: firstQuery().queryKey });
    secondHold.release();
    const whileRefetching = await settleWithin(
      invalidation,
      NEGATIVE_CLAIM_WINDOW,
    );

    firstHold.release();
    await invalidation;

    expect(whileRefetching).toBe('pending');
    expect(events).toEqual(['refetch', 'settled']);
  });

  describe('with a request on its way', () => {
    // The lasting query holds data, and nothing observes it while its request
    // numbered `held` waits for the spec; `answer` serves every request by number.
    async function renderHeldUnobserved(
      { held, answer }: { held: number; answer: (request: number) => Response },
    ) {
      const requests: string[] = [];
      const hold = holdResponse(answer);
      server.use(
        http.get(FIRST_URL, () => {
          requests.push(FIRST_PATH);
          return requests.length === held
            ? hold.answer(held)
            : answer(requests.length);
        }),
      );
      const store = await renderStore(() => ({
        ...useInvalidator(),
        waitForUnobserved: useWaitForUnobserved(),
        waitForLateRequests: useWaitForLateRequests(),
        lasting: createTestBedQuery(lastingQuery()),
      }));
      const unobserved = () =>
        store.waitForUnobserved({ queryKey: lastingQuery().queryKey });
      const mount = store.lasting.subscribe();
      await waitForSuccess(store.lasting);
      mount.unsubscribe();
      await unobserved();
      await store.invalidateAll([ACTION]);
      const remount = store.lasting.subscribe();
      await hold.requested;
      remount.unsubscribe();
      await unobserved();
      return { ...store, release: hold.release, requests };
    }

    it('should not take the answer from before the write as fresh for a query with no observer', async () => {
      const { invalidateAll, waitForLateRequests, lasting, release, requests } =
        await renderHeldUnobserved({
          held: 2,
          answer: () => HttpResponse.json(FIRST_PATH),
        });

      const write = invalidateAll([ACTION]);
      release();
      await write;
      await waitForLateRequests();
      subscriptions.push(lasting.subscribe());
      await waitForLateRequests();

      expect(requests).toHaveLength(3);
    });

    it('should resolve the write before the held answer of a query with no observer that no reader names, and leave it stale once it answers', async () => {
      const { invalidateAll, waitForLateRequests, lasting, release, requests } =
        await renderHeldUnobserved({
          held: 2,
          answer: () => HttpResponse.json(FIRST_PATH),
        });

      const beforeAnswer = await settleWithin(
        invalidateAll([ACTION]),
        NEGATIVE_CLAIM_WINDOW,
      );
      release();
      await waitForLateRequests();
      subscriptions.push(lasting.subscribe());
      await waitForLateRequests();

      expect(beforeAnswer).toBe('resolved');
      expect(requests).toHaveLength(3);
    });

    it('should send no request beyond its retries for a query with no observer failing with a 5xx, and leave it stale', async () => {
      const { invalidateAll, waitForLateRequests, lasting, release, requests } =
        await renderHeldUnobserved({
          held: 3,
          answer: (request) =>
            request === 1 || request > 3
              ? HttpResponse.json(FIRST_PATH)
              : HttpResponse.json(FIRST_PATH, { status: 503 }),
        });

      const write = invalidateAll([ACTION]);
      release();
      await write;
      await waitForLateRequests();
      const beforeMount = requests.length;
      subscriptions.push(lasting.subscribe());
      await waitForLateRequests();

      expect(beforeMount).toBe(3);
      expect(requests).toHaveLength(4);
    });

    it("should end an observed reader's wait on the read sent after the write, not on the first load from before it", async () => {
      const beforeWrite = holdResponse(NOOP_FN);
      const resent = holdResponse(NOOP_FN);
      const requests: string[] = [];
      serve(FIRST_PATH, () => {
        requests.push(FIRST_PATH);
        return requests.length === 1 ? beforeWrite.answer() : resent.answer();
      });
      const { invalidateAll, first } = await renderStore(() => ({
        ...useInvalidator(),
        first: createTestBedQuery(firstQuery()),
      }));
      subscriptions.push(first.subscribe());
      await beforeWrite.requested;

      const invalidation = invalidateAll([ACTION], [firstQuery().queryKey]);
      beforeWrite.release();
      const afterOldAnswer = await settleWithin(
        invalidation,
        NEGATIVE_CLAIM_WINDOW,
      );
      resent.release();

      expect(afterOldAnswer).toBe('pending');
      expect(await invalidation).toBeUndefined();
      expect(requests).toHaveLength(2);
    });
  });

  describe('with a reader', () => {
    const renderUnreadReader = () =>
      renderStore(() => ({
        ...useInvalidator(),
        waitForUnobserved: useWaitForUnobserved(),
        first: createTestBedQuery(firstQuery()),
      }));

    async function renderReader() {
      serve(FIRST_PATH, NOOP_FN);
      const store = await renderUnreadReader();
      subscriptions.push(store.first.subscribe());
      await waitForSuccess(store.first);
      return store;
    }

    // The reader's request is on its way with no observer when the write lands.
    async function holdUnobservedRead(
      { first, waitForUnobserved }: Awaited<
        ReturnType<typeof renderUnreadReader>
      >,
    ) {
      const beforeWrite = holdResponse(NOOP_FN);
      const reread = holdResponse(NOOP_FN);
      const requests: string[] = [];
      serve(FIRST_PATH, () => {
        requests.push(FIRST_PATH);
        return requests.length === 1 ? beforeWrite.answer() : reread.answer();
      });
      const load = first.subscribe();
      await beforeWrite.requested;
      load.unsubscribe();
      await waitForUnobserved({ queryKey: firstQuery().queryKey });
      return { beforeWrite, reread, requests };
    }

    async function expectWaitEndsOnReadAfter(
      store: Awaited<ReturnType<typeof renderUnreadReader>>,
    ) {
      const { beforeWrite, reread, requests } = await holdUnobservedRead(store);

      const invalidation = store.invalidateAll([ACTION], [
        firstQuery().queryKey,
      ]);
      beforeWrite.release();
      const waiting = assertDefined(await invalidation)();
      const afterOldAnswer = await settleWithin(
        waiting,
        NEGATIVE_CLAIM_WINDOW,
      );
      reread.release();

      expect(afterOldAnswer).toBe('pending');
      expect(await settleWithin(waiting, NEGATIVE_CLAIM_WINDOW))
        .toBe('resolved');
      expect(requests).toHaveLength(2);
    }

    it('should resolve a wait for the next read when the reader fails its refetch', async () => {
      const { invalidateAll } = await renderReader();
      failOnce(FIRST_URL);

      const untilRead = await invalidateAll([ACTION], [firstQuery().queryKey]);

      expect(untilRead).toBeTypeOf('function');
    });

    it('should resolve no wait when the reader reads in its refetch', async () => {
      const { invalidateAll } = await renderReader();

      expect(await invalidateAll([ACTION], [firstQuery().queryKey]))
        .toBeUndefined();
    });

    it('should resolve no wait for a reader that is not cached', async () => {
      const { invalidateAll } = await renderReader();
      failOnce(FIRST_URL);

      expect(await invalidateAll([ACTION], [secondQuery().queryKey]))
        .toBeUndefined();
    });

    it('should end the wait on a later read', async () => {
      const { invalidate, invalidateAll } = await renderReader();
      failOnce(FIRST_URL);
      const untilRead = assertDefined(
        await invalidateAll([ACTION], [firstQuery().queryKey]),
      );

      const waiting = untilRead();
      const beforeRead = await settleWithin(waiting, NEGATIVE_CLAIM_WINDOW);
      await invalidate(ACTION);

      expect(beforeRead).toBe('pending');
      expect(await settleWithin(waiting, NEGATIVE_CLAIM_WINDOW))
        .toBe('resolved');
    });

    it('should end the wait on a remount that reads, not on the observer loss before it', async () => {
      const { invalidateAll, first, waitForUnobserved } = await renderReader();
      failOnce(FIRST_URL);
      const untilRead = assertDefined(
        await invalidateAll([ACTION], [firstQuery().queryKey]),
      );

      const waiting = untilRead();
      subscriptions.splice(0).forEach((subscription) =>
        subscription.unsubscribe()
      );
      await waitForUnobserved({ queryKey: firstQuery().queryKey });
      const unobserved = await settleWithin(waiting, NEGATIVE_CLAIM_WINDOW);
      subscriptions.push(first.subscribe());

      expect(unobserved).toBe('pending');
      await waiting;
    });

    it('should resolve a wait for a reader cached with no observer, ended by the next mount that reads', async () => {
      const { invalidateAll, first, waitForUnobserved } = await renderReader();
      subscriptions.splice(0).forEach((subscription) =>
        subscription.unsubscribe()
      );
      await waitForUnobserved({ queryKey: firstQuery().queryKey });

      const untilRead = assertDefined(
        await invalidateAll([ACTION], [firstQuery().queryKey]),
      );
      const waiting = untilRead();
      const beforeMount = await settleWithin(waiting, NEGATIVE_CLAIM_WINDOW);
      subscriptions.push(first.subscribe());

      expect(beforeMount).toBe('pending');
      await waiting;
    });

    it('should end the wait for a reader with no observer on the read after the held answer from before the write', async () => {
      const store = await renderReader();
      subscriptions.splice(0).forEach((subscription) =>
        subscription.unsubscribe()
      );
      await store.waitForUnobserved({ queryKey: firstQuery().queryKey });

      await expectWaitEndsOnReadAfter(store);
    });

    it('should read again a reader with no observer once its first load from before the write answers, and end the wait on that read', async () => {
      await expectWaitEndsOnReadAfter(await renderUnreadReader());
    });

    it('should read a reader again once when two writes land during one of its requests', async () => {
      const store = await renderReader();
      subscriptions.splice(0).forEach((subscription) =>
        subscription.unsubscribe()
      );
      await store.waitForUnobserved({ queryKey: firstQuery().queryKey });
      const { beforeWrite, reread, requests } = await holdUnobservedRead(store);

      const writes = [ACTION, ACTION].map((action) =>
        store.invalidateAll([action], [firstQuery().queryKey])
      );
      beforeWrite.release();
      const waits = await Promise.all(writes);
      reread.release();
      await Promise.all(waits.map((wait) => assertDefined(wait)()));

      expect(requests).toHaveLength(2);
    });

    it('should end the wait when the reader leaves the cache', async () => {
      const { invalidate, invalidateAll } = await renderReader();
      failOnce(FIRST_URL);
      const untilRead = assertDefined(
        await invalidateAll([ACTION], [firstQuery().queryKey]),
      );

      const waiting = untilRead();
      await invalidate(InvalidateAction.Auth);

      expect(await settleWithin(waiting, NEGATIVE_CLAIM_WINDOW))
        .toBe('resolved');
    });
  });

  describe('with two readers', () => {
    async function renderReaders() {
      serve(FIRST_PATH, NOOP_FN);
      serve(SECOND_PATH, NOOP_FN);
      const store = await renderStore(() => ({
        ...useInvalidator(),
        waitForLateRequests: useWaitForLateRequests(),
        first: createTestBedQuery(firstQuery()),
        second: createTestBedQuery(secondQuery()),
      }));
      subscriptions.push(store.first.subscribe(), store.second.subscribe());
      await Promise.all([
        waitForSuccess(store.first),
        waitForSuccess(store.second),
      ]);
      failOnce(FIRST_URL);
      failOnce(SECOND_URL);
      const untilRead = assertDefined(
        await store.invalidateAll([ACTION], [
          firstQuery().queryKey,
          secondQuery().queryKey,
        ]),
      );
      return { ...store, waiting: untilRead() };
    }

    it('should end the wait only once both readers have read', async () => {
      const { invalidate, waiting } = await renderReaders();
      failOnce(SECOND_URL);

      await invalidate(ACTION);
      const oneRead = await settleWithin(waiting, NEGATIVE_CLAIM_WINDOW);
      await invalidate(ACTION);

      expect(oneRead).toBe('pending');
      expect(await settleWithin(waiting, NEGATIVE_CLAIM_WINDOW))
        .toBe('resolved');
    });

    it('should stop re-reading a reader that read while the other still waits', async () => {
      const { waitForLateRequests, waiting } = await renderReaders();
      const navigate = navigationRequests(waitForLateRequests, '/invalidator/');
      failOnce(SECOND_URL);
      await navigate();
      const oneRead = await settleWithin(waiting, NEGATIVE_CLAIM_WINDOW);

      const requests = await navigate();

      expect(oneRead).toBe('pending');
      expect(requests).toEqual([`GET ${SECOND_PATH}`]);
      await waiting;
    });
  });

  describe('with a Snapshot reader', () => {
    it('should resolve a wait for the next read when a further page fails', async () => {
      const { invalidateAll } = await renderSnapshot();
      serveGrownList(notFound).release();

      const untilRead = await invalidateAll(
        [LIST_ACTION],
        [LIST_QUERY.queryKey],
      );

      expect(untilRead).toBeTypeOf('function');
    });

    it('should resolve no wait when the further page is read', async () => {
      const { invalidateAll } = await renderSnapshot();
      serveGrownList(() =>
        pagedResponse({ body: [movieListItem(482)], page: 2, pageCount: 2 })
      ).release();

      expect(await invalidateAll([LIST_ACTION], [LIST_QUERY.queryKey]))
        .toBeUndefined();
    });

    it('should end the wait on a later read', async () => {
      const { invalidate, invalidateAll } = await renderSnapshot();
      serveGrownList(notFound).release();
      const untilRead = assertDefined(
        await invalidateAll([LIST_ACTION], [LIST_QUERY.queryKey]),
      );

      const waiting = untilRead();
      const beforeRead = await settleWithin(waiting, NEGATIVE_CLAIM_WINDOW);
      servePaged({ url: ITEMS_URL, body: [movieListItem(481)] });
      await invalidate(LIST_ACTION);

      expect(beforeRead).toBe('pending');
      expect(await settleWithin(waiting, NEGATIVE_CLAIM_WINDOW))
        .toBe('resolved');
    });

    it('should end the wait on a remount that reads', async () => {
      const { invalidateAll, snapshot, subscription, waitForUnobserved } =
        await renderSnapshot();
      serveGrownList(notFound).release();
      const untilRead = assertDefined(
        await invalidateAll([LIST_ACTION], [LIST_QUERY.queryKey]),
      );

      const waiting = untilRead();
      subscription.unsubscribe();
      await waitForUnobserved({ queryKey: LIST_QUERY.queryKey });
      const unobserved = await settleWithin(waiting, NEGATIVE_CLAIM_WINDOW);
      servePaged({ url: ITEMS_URL, body: [movieListItem(481)] });
      subscriptions.push(snapshot.subscribe());

      expect(unobserved).toBe('pending');
      await waiting;
    });

    it('should not re-read on a later navigation a reader with no observer that a navigation re-read cleanly', async () => {
      const {
        invalidateAll,
        subscription,
        waitForUnobserved,
        waitForLateRequests,
      } = await renderSnapshot();
      serveGrownList(notFound).release();
      const untilRead = assertDefined(
        await invalidateAll([LIST_ACTION], [LIST_QUERY.queryKey]),
      );
      const waiting = untilRead();
      subscription.unsubscribe();
      await waitForUnobserved({ queryKey: LIST_QUERY.queryKey });
      servePaged({ url: ITEMS_URL, body: [movieListItem(481)] });
      const navigate = navigationRequests(waitForLateRequests, '/items');

      const first = await navigate();
      const second = await navigate();

      expect(first).toHaveLength(1);
      expect(second).toEqual([]);
      expect(await settleWithin(waiting, NEGATIVE_CLAIM_WINDOW))
        .toBe('pending');
    });
  });

  describe('when a refetch lands with a further page to read', () => {
    it('should wait until the further page is read', async () => {
      const { invalidate, reads } = await renderSnapshot();
      const { requested, release } = serveGrownList(() =>
        pagedResponse({ body: [movieListItem(482)], page: 2, pageCount: 2 })
      );

      const invalidation = invalidate(LIST_ACTION);
      await requested;
      const whileLoading = await settleWithin(
        invalidation,
        NEGATIVE_CLAIM_WINDOW,
      );
      release();
      await invalidation;

      expect(whileLoading).toBe('pending');
      expect(reads.at(-1)).toEqual([481, 482]);
    });

    it('should send no page request beyond its refetch when a write lands while the further page loads', async () => {
      const { invalidate } = await renderSnapshot();
      const { requested, release } = serveGrownList(() =>
        pagedResponse({ body: [movieListItem(482)], page: 2, pageCount: 2 })
      );
      const loading = invalidate(LIST_ACTION);
      await requested;

      const requests = await captureRequests(async () => {
        const write = invalidate(LIST_ACTION);
        release();
        await Promise.all([loading, write]);
      }, { pathIncludes: '/items' });

      expect(requests).toHaveLength(2);
    });

    it('should send each page once when two writes land while a list nothing shows refetches', async () => {
      const {
        invalidate,
        subscription,
        waitForUnobserved,
        waitForLateRequests,
      } = await renderSnapshot();
      const secondPage = () =>
        pagedResponse({ body: [movieListItem(482)], page: 2, pageCount: 2 });
      serveGrownList(secondPage).release();
      await invalidate(LIST_ACTION);
      const { requested, release } = serveGrownList(secondPage);

      const requests = await captureRequests(async () => {
        const refetch = invalidate(LIST_ACTION);
        await requested;
        subscription.unsubscribe();
        await waitForUnobserved({ queryKey: LIST_QUERY.queryKey });
        const writes = [invalidate(LIST_ACTION), invalidate(LIST_ACTION)];
        release();
        await Promise.all([refetch, ...writes]);
        await waitForLateRequests();
      }, { pathIncludes: '/items' });

      expect(requests).toHaveLength(2);
    });

    it('should stop waiting when the further page fails', async () => {
      const { invalidate } = await renderSnapshot();
      const { release, requests } = serveGrownList(notFound);
      release();

      await invalidate(LIST_ACTION);

      expect(requests).toHaveLength(1);
    });

    it('should stop waiting when nothing reads the Query any more', async () => {
      const { invalidate, waitForUnobserved, subscription } =
        await renderSnapshot();
      const { requested, release, requests } = serveGrownList(() =>
        pagedResponse({ body: [movieListItem(482)], page: 2, pageCount: 2 })
      );

      const invalidation = invalidate(LIST_ACTION);
      await requested;
      subscription.unsubscribe();
      await waitForUnobserved({ queryKey: LIST_QUERY.queryKey });
      await invalidation;
      release();

      expect(requests).toHaveLength(1);
    });
  });
});
