import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { userListItemIdsQuery } from '$lib/requests/queries/users/userListItemIdsQuery.ts';
import { ITEMS_URL } from '$mocks/data/users/ITEMS_URL.ts';
import { LIST_ID } from '$mocks/data/users/LIST_ID.ts';
import { server } from '$mocks/server.ts';
import { kindsOf } from '$test/beds/query/kindsOf.ts';
import { nextOf } from '$test/beds/query/nextOf.ts';
import { runStaleTimers } from '$test/beds/query/runStaleTimers.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { holdResponse } from '$test/beds/request/holdResponse.ts';
import { movieListItem } from '$test/beds/request/movieListItem.ts';
import { notFound } from '$test/beds/request/notFound.ts';
import { pagedResponse } from '$test/beds/request/pagedResponse.ts';
import { servePaged } from '$test/beds/request/servePaged.ts';
import { serveTwoPages } from '$test/beds/request/serveTwoPages.ts';
import { useWaitForQueriesIdle } from '$test/beds/query/useWaitForQueriesIdle.ts';
import { useWaitForUnobserved } from '$test/beds/query/useWaitForUnobserved.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { collectStates } from '$test/beds/store/collectStates.ts';
import { idsOf } from '$test/beds/store/idsOf.ts';
import { readKnown } from '$test/beds/store/readKnown.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { http } from 'msw';
import { filter, firstValueFrom, map, type Observable } from 'rxjs';
import { describe, expect, it, onTestFinished, vi } from 'vitest';
import { useQueryClient } from './_internal/queryClientContext.ts';
import { useInvalidator } from './useInvalidator.ts';
import { useSnapshot, useSnapshotStatus } from './useSnapshot.ts';

const ACTION = InvalidateAction.ListedIn(LIST_ID);
const QUERY_KEY = userListItemIdsQuery({ userId: 'me', listId: LIST_ID })
  .queryKey;

function serveOnePage(ids: ReadonlyArray<number>) {
  servePaged({ url: ITEMS_URL, body: ids.map(movieListItem) });
}

// The second page waits for the spec, so a read can be taken while it loads.
function serveGrownList() {
  const held = holdResponse(() =>
    pagedResponse({ body: [movieListItem(482)], page: 2, pageCount: 2 })
  );
  serveTwoPages({
    url: ITEMS_URL,
    first: [movieListItem(481)],
    second: held.answer,
  });

  return { requested: held.requested, release: held.release };
}

function snapshotStore(whileUnsettled: 'hold' | 'unknown' = 'hold') {
  return renderStore(() => ({
    ...useInvalidator(),
    client: useQueryClient(),
    waitForUnobserved: useWaitForUnobserved(),
    first: useSnapshot(
      userListItemIdsQuery({ userId: 'me', listId: LIST_ID }),
      { select: idsOf, whileUnsettled },
    ),
    second: useSnapshot(
      userListItemIdsQuery({ userId: 'me', listId: LIST_ID }),
      { select: idsOf, whileUnsettled },
    ),
  }));
}

function readGrown(snapshot: Observable<ReadonlyArray<number> | undefined>) {
  return firstValueFrom(
    snapshot.pipe(filter((ids) => ids?.length === 2)),
  );
}

describe('useSnapshot', () => {
  it('should read the hold of another call when it starts while a further page loads', async () => {
    serveOnePage([481]);
    const { invalidate, first, second } = await snapshotStore();
    collectStates(first);
    await readKnown(first);
    const { requested, release } = serveGrownList();

    const invalidation = invalidate(ACTION);
    await requested;
    const reads = collectStates(second);
    release();
    await readGrown(second);
    await invalidation;

    expect(reads).toEqual([[481], [481, 482]]);
  });

  it('should read its hold again when it resubscribes after its teardown while a further page loads', async () => {
    serveOnePage([481]);
    const { invalidate, waitForUnobserved, first } = await snapshotStore();
    const subscription = first.subscribe();
    await readKnown(first);
    const { requested, release } = serveGrownList();
    const invalidation = invalidate(ACTION);
    await requested;

    subscription.unsubscribe();
    await waitForUnobserved({ queryKey: QUERY_KEY });
    const reads = collectStates(first);
    release();
    await readGrown(first);
    await invalidation;

    expect(reads).toEqual([[481], [481, 482]]);
  });

  it('should read what select makes of the entries over every page', async () => {
    serveTwoPages({
      url: ITEMS_URL,
      first: [movieListItem(481)],
      second: () =>
        pagedResponse({ body: [movieListItem(482)], page: 2, pageCount: 2 }),
    });
    const { first } = await snapshotStore();

    expect(await readGrown(first)).toEqual([481, 482]);
  });

  it('should read nothing from a removed Query once its stale timer fires', async () => {
    // A removed Query's observer emits only through its stale timer.
    runStaleTimers();
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'Date'],
      shouldAdvanceTime: true,
    });
    onTestFinished(() => {
      vi.useRealTimers();
    });
    serveOnePage([481]);
    const { invalidate, first, second } = await snapshotStore();
    const reads = collectStates(first);
    await readKnown(first);

    await invalidate(InvalidateAction.Auth);
    serveOnePage([482]);
    collectStates(second);
    await readKnown(second);
    expect(reads.at(-1)).toEqual([481]);
    vi.runOnlyPendingTimers();

    await vi.waitFor(() => expect(reads.at(-1)).toBeUndefined());
  });

  it("should read a reset Query's next settle", async () => {
    serveOnePage([481]);
    const { invalidate, client, first } = await snapshotStore();
    const reads = collectStates(first);
    await readKnown(first);
    serveOnePage([482]);
    await invalidate(ACTION);

    serveOnePage([483]);
    await client.resetQueries({ queryKey: QUERY_KEY });

    await vi.waitFor(() =>
      expect(reads).toEqual([undefined, [481], [482], undefined, [483]])
    );
  });

  describe('when asked for unknown while unsettled', () => {
    it('should read as not known while a loaded page refetches', async () => {
      serveOnePage([481]);
      const { invalidate, first } = await snapshotStore('unknown');
      const reads = collectStates(first);
      await readKnown(first);
      const { release } = holdRequest({
        method: 'get',
        url: ITEMS_URL,
        answer: () => pagedResponse({ body: [movieListItem(481)] }),
      });

      const invalidation = invalidate(ACTION);
      await firstValueFrom(first.pipe(filter((ids) => ids === undefined)));
      release();
      await invalidation;

      expect(reads).toEqual([undefined, [481], undefined, [481]]);
    });
  });
});

type IdsStatus = SectionStatus<ReadonlyArray<number>>;

function failItems() {
  const requests: string[] = [];
  server.use(
    http.get(ITEMS_URL, ({ request }) => {
      requests.push(request.url);
      return notFound();
    }),
  );

  return requests;
}

function statusStore(select = idsOf) {
  return renderStore(() => ({
    ...useInvalidator(),
    waitForQueriesIdle: useWaitForQueriesIdle(),
    status: useSnapshotStatus(
      userListItemIdsQuery({ userId: 'me', listId: LIST_ID }),
      { select, isEmpty: (ids) => ids.length === 0 },
    ),
    second: useSnapshotStatus(
      userListItemIdsQuery({ userId: 'me', listId: LIST_ID }),
      { select, isEmpty: (ids) => ids.length === 0 },
    ),
  }));
}

function serveFailedNextPage(
  second: () => Response | Promise<Response> = notFound,
) {
  serveTwoPages({ url: ITEMS_URL, first: [movieListItem(481)], second });
}

// The retry's first page and then its second wait for the spec, so a read can be taken during each.
function holdRetry() {
  const secondPage = serveGrownList();

  return {
    firstPage: holdRequest({ method: 'get', url: ITEMS_URL }),
    secondPage,
  };
}

function kindsAll(status: Observable<IdsStatus>) {
  return collectStates(status.pipe(map(({ kind }) => kind)));
}

function nextOfLength(status: Observable<IdsStatus>, length: number) {
  return firstValueFrom(
    status.pipe(
      filter((read) => read.kind === 'ready' && read.data.length === length),
    ),
  );
}

describe('useSnapshotStatus', () => {
  it('should read loading, then ready with what select makes of every page', async () => {
    serveTwoPages({
      url: ITEMS_URL,
      first: [movieListItem(481)],
      second: () =>
        pagedResponse({ body: [movieListItem(482)], page: 2, pageCount: 2 }),
    });
    const { status } = await statusStore();
    const kinds = kindsOf(status);

    expect(await nextOf(status, 'ready')).toEqual({
      kind: 'ready',
      data: [481, 482],
    });
    expect(kinds).toEqual(['loading', 'ready']);
  });

  it('should read empty when every page is empty', async () => {
    serveOnePage([]);
    const { status } = await statusStore();
    const kinds = kindsOf(status);

    await nextOf(status, 'empty');

    expect(kinds).toEqual(['loading', 'empty']);
  });

  it('should read error when the first page fails, then ready once a retry lands', async () => {
    failItems();
    const { status } = await statusStore();
    const kinds = kindsOf(status);
    const failed = await nextOf(status, 'error');

    serveOnePage([481]);
    failed.retry();

    expect(await nextOf(status, 'ready')).toEqual({
      kind: 'ready',
      data: [481],
    });
    expect(kinds).toEqual(['loading', 'error', 'loading', 'ready']);
  });

  describe('when a retry after a failed next page runs', () => {
    it('should read error on the first load, then loading until every page lands, then ready', async () => {
      serveFailedNextPage();
      const { status } = await statusStore();
      const kinds = kindsAll(status);
      const failed = await nextOf(status, 'error');
      const { firstPage, secondPage } = holdRetry();
      const failedKinds = [...kinds];

      failed.retry();
      await firstPage.requested;
      await waitNegativeClaim();
      firstPage.release();
      await secondPage.requested;
      await waitNegativeClaim();
      const retryKinds = kinds.slice(failedKinds.length);
      secondPage.release();
      const landed = await nextOfLength(status, 2);

      expect(failedKinds.at(0)).toBe('loading');
      expect(failedKinds.filter((kind) => kind !== 'loading')).toEqual([
        'error',
      ]);
      expect(failedKinds.at(-1)).toBe('error');
      expect(retryKinds).not.toHaveLength(0);
      expect(retryKinds.filter((kind) => kind !== 'loading')).toEqual([]);
      expect(kinds.slice(failedKinds.length + retryKinds.length)).toEqual([
        'ready',
      ]);
      expect(landed).toEqual({ kind: 'ready', data: [481, 482] });
    });

    it('should read loading in a call that starts during it', async () => {
      serveFailedNextPage();
      const { status, second } = await statusStore();
      collectStates(status);
      const failed = await nextOf(status, 'error');
      const { firstPage, secondPage } = holdRetry();

      failed.retry();
      await firstPage.requested;
      const kinds = kindsAll(second);
      await waitNegativeClaim();
      firstPage.release();
      await secondPage.requested;
      await waitNegativeClaim();
      const retryKinds = [...kinds];
      secondPage.release();
      await nextOfLength(second, 2);

      expect(retryKinds).not.toHaveLength(0);
      expect(retryKinds.filter((kind) => kind !== 'loading')).toEqual([]);
      expect(kinds.slice(retryKinds.length)).toEqual(['ready']);
    });

    it('should read error with a retry when the next page fails again', async () => {
      serveFailedNextPage();
      const { waitForQueriesIdle, status } = await statusStore();
      const reads = collectStates(status);
      const failed = await nextOf(status, 'error');
      const secondPage = holdResponse(notFound);
      serveFailedNextPage(secondPage.answer);
      const failedReads = reads.length;

      failed.retry();
      await secondPage.requested;
      secondPage.release();
      await waitForQueriesIdle({ queryKey: QUERY_KEY });
      const retryReads = reads.slice(failedReads);

      expect(retryReads.slice(0, -1)).not.toHaveLength(0);
      expect(
        retryReads.slice(0, -1).filter(({ kind }) => kind !== 'loading'),
      ).toEqual([]);
      expect(retryReads.at(-1)).toEqual({
        kind: 'error',
        retry: expect.any(Function),
      });
    });
  });

  it('should keep reading ready when a refetch after a settled read fails', async () => {
    serveOnePage([481]);
    const { invalidate, waitForQueriesIdle, status } = await statusStore();
    const reads = collectStates(status);
    const kinds = kindsOf(status);
    await nextOf(status, 'ready');
    const requests = failItems();

    await invalidate(ACTION);
    await waitForQueriesIdle({ queryKey: QUERY_KEY });

    expect(requests).toHaveLength(1);
    expect(reads.at(-1)).toEqual({ kind: 'ready', data: [481] });
    expect(kinds).toEqual(['loading', 'ready']);
  });

  it('should select once for the same entries however often the status changes', async () => {
    serveOnePage([481]);
    const select = vi.fn(idsOf);
    const { invalidate, waitForQueriesIdle, status } = await statusStore(
      select,
    );
    const reads = collectStates(status);
    await nextOf(status, 'ready');

    await invalidate(ACTION);
    await waitForQueriesIdle({ queryKey: QUERY_KEY });

    expect(reads.length).toBeGreaterThan(2);
    expect(select).toHaveBeenCalledTimes(1);
  });
});
