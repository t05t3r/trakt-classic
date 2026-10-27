import { defineQuery } from '$lib/features/query/defineQuery.ts';
import { type ApiParams, rawApiFetch } from '$lib/requests/api.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { userListItemIdsQuery } from '$lib/requests/queries/users/userListItemIdsQuery.ts';
import { NOOP_FN } from '$lib/utils/NOOP_FN.ts';
import { ITEMS_URL } from '$mocks/data/users/ITEMS_URL.ts';
import { LIST_ID } from '$mocks/data/users/LIST_ID.ts';
import { server } from '$mocks/server.ts';
import { setNetwork } from '$test/beds/network/setNetwork.ts';
import { NEGATIVE_CLAIM_WINDOW } from '$test/beds/promise/NEGATIVE_CLAIM_WINDOW.ts';
import { settleWithin } from '$test/beds/promise/settleWithin.ts';
import { createTestBedQuery } from '$test/beds/query/createTestBedQuery.ts';
import { useWaitForQueryFetching } from '$test/beds/query/useWaitForQueryFetching.ts';
import { useWaitForQueryPaused } from '$test/beds/query/useWaitForQueryPaused.ts';
import { useWaitForUnobserved } from '$test/beds/query/useWaitForUnobserved.ts';
import { holdResponse } from '$test/beds/request/holdResponse.ts';
import { movieListItem } from '$test/beds/request/movieListItem.ts';
import { notFound } from '$test/beds/request/notFound.ts';
import { pagedResponse } from '$test/beds/request/pagedResponse.ts';
import { serveTwoPages } from '$test/beds/request/serveTwoPages.ts';
import { idsOf } from '$test/beds/store/idsOf.ts';
import { readKnown } from '$test/beds/store/readKnown.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { http, HttpResponse } from 'msw';
import { filter, firstValueFrom, type Subscription } from 'rxjs';
import { afterEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { useInvalidator } from './useInvalidator.ts';
import { useSnapshot } from './useSnapshot.ts';

const ACTION = InvalidateAction.Rated('movie');
const FIRST_PATH = '/invalidator/first';
const SECOND_PATH = '/invalidator/second';

const invalidatedQuery = (key: string, path: string) =>
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
    ttl: null,
  });

const firstQuery = invalidatedQuery('invalidatorFirst', FIRST_PATH);
const secondQuery = invalidatedQuery('invalidatorSecond', SECOND_PATH);

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
    await firstValueFrom(first.pipe(filter((result) => result.isSuccess)));

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
    await firstValueFrom(first.pipe(filter((result) => result.isSuccess)));
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

  describe('when a refetch lands with a further page to read', () => {
    async function renderSnapshot() {
      server.use(
        http.get(
          ITEMS_URL,
          () => pagedResponse({ body: [movieListItem(481)] }),
        ),
      );
      const store = await renderStore(() => ({
        ...useInvalidator(),
        waitForUnobserved: useWaitForUnobserved(),
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
