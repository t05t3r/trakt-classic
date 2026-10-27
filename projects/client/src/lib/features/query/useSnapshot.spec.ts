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
import { serveTwoPages } from '$test/beds/request/serveTwoPages.ts';
import { useWaitForQueriesIdle } from '$test/beds/query/useWaitForQueriesIdle.ts';
import { useWaitForUnobserved } from '$test/beds/query/useWaitForUnobserved.ts';
import { idsOf } from '$test/beds/store/idsOf.ts';
import { readKnown } from '$test/beds/store/readKnown.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { http } from 'msw';
import { filter, firstValueFrom, type Observable } from 'rxjs';
import { describe, expect, it, onTestFinished, vi } from 'vitest';
import { useQueryClient } from './_internal/queryClientContext.ts';
import { useInvalidator } from './useInvalidator.ts';
import { useSnapshot, useSnapshotStatus } from './useSnapshot.ts';

const ACTION = InvalidateAction.ListedIn(LIST_ID);
const QUERY_KEY = userListItemIdsQuery({ userId: 'me', listId: LIST_ID })
  .queryKey;

function serveOnePage(ids: ReadonlyArray<number>) {
  server.use(
    http.get(ITEMS_URL, () => pagedResponse({ body: ids.map(movieListItem) })),
  );
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

function record<T>(snapshot: Observable<T>): ReadonlyArray<T> {
  const reads: T[] = [];
  const subscription = snapshot.subscribe((value) => reads.push(value));
  onTestFinished(() => subscription.unsubscribe());
  return reads;
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
    record(first);
    await readKnown(first);
    const { requested, release } = serveGrownList();

    const invalidation = invalidate(ACTION);
    await requested;
    const reads = record(second);
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
    const reads = record(first);
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
    const reads = record(first);
    await readKnown(first);

    await invalidate(InvalidateAction.Auth);
    serveOnePage([482]);
    record(second);
    await readKnown(second);
    expect(reads.at(-1)).toEqual([481]);
    vi.runOnlyPendingTimers();

    await vi.waitFor(() => expect(reads.at(-1)).toBeUndefined());
  });

  it("should read a reset Query's next settle", async () => {
    serveOnePage([481]);
    const { invalidate, client, first } = await snapshotStore();
    const reads = record(first);
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
      const reads = record(first);
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
  }));
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

  it('should read error when a next page fails on the first load, then ready once a retry lands', async () => {
    serveTwoPages({
      url: ITEMS_URL,
      first: [movieListItem(481)],
      second: notFound,
    });
    const { status } = await statusStore();
    const kinds = kindsOf(status);
    const failed = await nextOf(status, 'error');
    serveTwoPages({
      url: ITEMS_URL,
      first: [movieListItem(481)],
      second: () =>
        pagedResponse({ body: [movieListItem(482)], page: 2, pageCount: 2 }),
    });

    failed.retry();

    expect(await nextOfLength(status, 2)).toEqual({
      kind: 'ready',
      data: [481, 482],
    });
    expect(kinds.slice(0, 2)).toEqual(['loading', 'error']);
  });

  it('should keep reading ready when a refetch after a settled read fails', async () => {
    serveOnePage([481]);
    const { invalidate, waitForQueriesIdle, status } = await statusStore();
    const reads = record(status);
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
    const reads = record(status);
    await nextOf(status, 'ready');

    await invalidate(ACTION);
    await waitForQueriesIdle({ queryKey: QUERY_KEY });

    expect(reads.length).toBeGreaterThan(2);
    expect(select).toHaveBeenCalledTimes(1);
  });
});
