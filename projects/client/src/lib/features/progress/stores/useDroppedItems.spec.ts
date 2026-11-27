import { useDrop } from '$lib/features/media-actions/stores/useDrop.ts';
import { PROGRESS_SORTS } from '$lib/features/progress/PROGRESS_SORTS.ts';
import { droppedShowsQuery } from '$lib/requests/queries/users/droppedShowsQuery.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { DEVS } from '$mocks/data/media-actions/DEVS.ts';
import { DEVS_DROP_SHOW } from '$mocks/data/media-actions/DEVS_DROP_SHOW.ts';
import { SILO } from '$mocks/data/media-actions/SILO.ts';
import { SILO_DROP_SHOW } from '$mocks/data/media-actions/SILO_DROP_SHOW.ts';
import { ShowDevsResponseMock } from '$mocks/data/summary/shows/devs/ShowDevsResponseMock.ts';
import { ShowSiloResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloResponseMock.ts';
import { LATEST_WATCHED_AT } from '$mocks/data/sync/LATEST_WATCHED_AT.ts';
import { WATCHED_PROGRESS_URL } from '$mocks/data/sync/WATCHED_PROGRESS_URL.ts';
import { DROPPED_AT } from '$mocks/data/users/DROPPED_AT.ts';
import { DROP_URL } from '$mocks/data/users/DROP_URL.ts';
import { DROPPED_URL } from '$mocks/data/users/DROPPED_URL.ts';
import { RESTORE_URL } from '$mocks/data/users/RESTORE_URL.ts';
import { SILO_DROPPED } from '$mocks/data/users/SILO_DROPPED.ts';
import { DroppedShowsResponseMock } from '$mocks/data/users/response/DroppedShowsResponseMock.ts';
import { answerDialog } from '$test/beds/dialogs/answerDialog.ts';
import { kindsOf } from '$test/beds/query/kindsOf.ts';
import { nextOf } from '$test/beds/query/nextOf.ts';
import { useWaitForLateRequests } from '$test/beds/query/useWaitForLateRequests.ts';
import { useWaitForQueriesIdle } from '$test/beds/query/useWaitForQueriesIdle.ts';
import { failOnce } from '$test/beds/request/failOnce.ts';
import { holdPost } from '$test/beds/request/holdPost.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { recordSearches } from '$test/beds/request/recordSearches.ts';
import { servePaged } from '$test/beds/request/servePaged.ts';
import { watchedProgressRow } from '$test/beds/request/watchedProgressRow.ts';
import { pagedItemsOf } from '$test/beds/store/pagedItemsOf.ts';
import { readingOf } from '$test/beds/store/readingOf.ts';
import { readyIdsOf } from '$test/beds/store/readyIdsOf.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { shownIdsOf } from '$test/beds/store/shownIdsOf.ts';
import { statusOf } from '$test/beds/store/statusOf.ts';
import { describe, expect, it, vi } from 'vitest';
import { type DroppedItemsValues, useDroppedItems } from './useDroppedItems.ts';

const { by, how } = assertDefined(PROGRESS_SORTS.dropped.at(0));

const VALUES: DroppedItemsValues = {
  filters: { view: 'dropped', sort: { by, how } },
  watched: null,
  page: 1,
};

const DEVS_ROW = watchedProgressRow({
  show: ShowDevsResponseMock,
  lastWatchedAt: '2025-01-10T10:00:00.000Z',
  aired: 8,
  completed: 5,
  minutesLeft: 150,
});

const SILO_ROW = watchedProgressRow({
  show: ShowSiloResponseMock,
  lastWatchedAt: LATEST_WATCHED_AT,
  aired: 10,
  completed: 10,
});

const serveBothDropped = () =>
  servePaged({
    url: DROPPED_URL,
    body: [...DroppedShowsResponseMock, SILO_DROPPED],
  });

const BOTH_STATS = { completed: 15, aired: 18, minutesLeft: 150, shows: 2 };

const droppedItems = pagedItemsOf(useDroppedItems, VALUES);

describe('store: useDroppedItems', () => {
  it('should read loading while the rows are not known, then ready', async () => {
    servePaged({ url: WATCHED_PROGRESS_URL, body: [DEVS_ROW] });
    const held = holdRequest({ method: 'get', url: WATCHED_PROGRESS_URL });
    const { reading, waitForQueriesIdle } = await renderStore(() => ({
      ...droppedItems({}).store(),
      waitForQueriesIdle: useWaitForQueriesIdle(),
    }));
    const kinds = kindsOf(statusOf(reading));

    await held.requested;
    await waitForQueriesIdle({
      queryKey: [droppedShowsQuery({ limit: 1 }).queryKey.at(0)],
    });
    expect(kinds).toEqual(['loading']);

    held.release();
    await nextOf(statusOf(reading), 'ready');
    expect(kinds).toEqual(['loading', 'ready']);
  });

  it('should read a failed read as error, and land the rows on Retry', async () => {
    servePaged({ url: WATCHED_PROGRESS_URL, body: [DEVS_ROW] });
    failOnce(WATCHED_PROGRESS_URL);
    const { reading } = await renderStore(droppedItems({}).store);

    const failed = await nextOf(statusOf(reading), 'error');
    failed.retry();

    expect(await readyIdsOf(reading)).toEqual([DEVS.id]);
  });

  it('should clamp a page past the last', async () => {
    servePaged({ url: WATCHED_PROGRESS_URL, body: [DEVS_ROW] });
    const { store, replacePage } = droppedItems({ page: 3 });
    const { reading } = await renderStore(store);
    const kinds = kindsOf(statusOf(reading));

    await vi.waitFor(() => expect(replacePage).toHaveBeenCalledWith(1));

    expect(kinds).toEqual(['loading']);
  });

  it('should read rows with no dropped show among them as empty, with nothing summed', async () => {
    servePaged({ url: WATCHED_PROGRESS_URL, body: [SILO_ROW] });
    const { reading } = await renderStore(droppedItems({}).store);

    await nextOf(statusOf(reading), 'empty');

    expect(await readingOf(reading, 'stats')).toEqual({
      completed: 0,
      aired: 0,
      minutesLeft: 0,
      shows: 0,
    });
  });

  it('should list each dropped show with its row and the date it was dropped, and leave out a show not dropped', async () => {
    servePaged({ url: WATCHED_PROGRESS_URL, body: [DEVS_ROW, SILO_ROW] });
    const { reading } = await renderStore(droppedItems({}).store);

    const ready = await nextOf(statusOf(reading), 'ready');

    expect(ready.data.map(({ entry, droppedAt }) => [entry.show.id, droppedAt]))
      .toEqual([[DEVS.id, DROPPED_AT]]);
  });

  it.each(
    [
      {
        sort: { by: 'added', how: 'asc' },
        served: [DEVS_ROW, SILO_ROW],
        ids: [SILO.id, DEVS.id],
      },
      {
        sort: { by: 'added', how: 'desc' },
        served: [SILO_ROW, DEVS_ROW],
        ids: [DEVS.id, SILO.id],
      },
      {
        sort: { by: 'hidden', how: 'desc' },
        served: [SILO_ROW, DEVS_ROW],
        ids: [DEVS.id, SILO.id],
      },
    ] as const,
  )(
    'should reorder the rows served by the resolved sort, under $sort.by $sort.how',
    async ({ sort, served, ids }) => {
      serveBothDropped();
      servePaged({ url: WATCHED_PROGRESS_URL, body: served });
      const { reading } = await renderStore(
        droppedItems({ filters: { view: 'dropped', sort } }).store,
      );

      expect(await readyIdsOf(reading)).toEqual(ids);
    },
  );

  it.each(
    [
      {
        watched: 'fade',
        rows: [[SILO.id, true], [DEVS.id, false]],
        itemCount: 2,
        stats: BOTH_STATS,
      },
      {
        watched: 'hide',
        rows: [[DEVS.id, false]],
        itemCount: 1,
        stats: { completed: 5, aired: 8, minutesLeft: 150, shows: 1 },
      },
      {
        watched: null,
        rows: [[SILO.id, false], [DEVS.id, false]],
        itemCount: 2,
        stats: BOTH_STATS,
      },
    ] as const,
  )(
    'should fade or hide the complete rows, and count and sum the rows it lists, under $watched',
    async ({ watched, rows, itemCount, stats }) => {
      serveBothDropped();
      servePaged({ url: WATCHED_PROGRESS_URL, body: [DEVS_ROW, SILO_ROW] });
      const { reading } = await renderStore(droppedItems({ watched }).store);

      const ready = await nextOf(statusOf(reading), 'ready');

      expect(ready.data.map(({ entry, isFaded }) => [entry.show.id, isFaded]))
        .toEqual(rows);
      expect(await readingOf(reading, 'itemCount')).toBe(itemCount);
      expect(await readingOf(reading, 'stats')).toEqual(stats);
    },
  );

  it('should read the shared rows, with no hide_completed and the default sort, whatever the eye and the sort', async () => {
    const searches = recordSearches(WATCHED_PROGRESS_URL, []);
    const { reading, waitForLateRequests } = await renderStore(() => ({
      ...droppedItems({
        filters: { view: 'dropped', sort: { by: 'title', how: 'asc' } },
        watched: 'hide',
      }).store(),
      waitForLateRequests: useWaitForLateRequests(),
    }));

    await readingOf(reading, 'entries');
    await waitForLateRequests();

    expect(searches).toHaveLength(1);
    searches.forEach((search) => {
      expect(search.get('sort_by')).toBe('added');
      expect(search.get('sort_how')).toBe('desc');
      expect(search.has('hide_completed')).toBe(false);
    });
  });

  it('should take a listed show off the list while its Restore is pending', async () => {
    serveBothDropped();
    servePaged({ url: WATCHED_PROGRESS_URL, body: [DEVS_ROW, SILO_ROW] });
    const restoring = holdPost(RESTORE_URL);
    const { reading, restore } = await renderStore(() => ({
      ...droppedItems({}).store(),
      restore: useDrop(DEVS_DROP_SHOW).restore,
    }));
    const shown = shownIdsOf(reading);
    await vi.waitFor(() => expect(shown.at(-1)).toEqual([SILO.id, DEVS.id]));

    const restored = restore();
    await answerDialog('Restore this show?', 'Yes, restore it!');
    await restoring.requested;

    await vi.waitFor(() => expect(shown.at(-1)).toEqual([SILO.id]));

    restoring.release();
    await restored;
  });

  it('should leave a show whose Drop is pending out until the dropped list holds its date', async () => {
    servePaged({ url: WATCHED_PROGRESS_URL, body: [DEVS_ROW, SILO_ROW] });
    const dropping = holdPost(DROP_URL);
    const { reading, drop, waitForLateRequests } = await renderStore(() => ({
      ...droppedItems({}).store(),
      drop: useDrop(SILO_DROP_SHOW).drop,
      waitForLateRequests: useWaitForLateRequests(),
    }));
    const shown = shownIdsOf(reading);
    await vi.waitFor(() => expect(shown.at(-1)).toEqual([DEVS.id]));

    const dropped = drop();
    await dropping.requested;
    await waitForLateRequests();

    expect(shown).not.toContainEqual(expect.arrayContaining([SILO.id]));
    expect(shown.at(-1)).toEqual([DEVS.id]);

    serveBothDropped();
    dropping.release();
    await dropped;

    await vi.waitFor(() => expect(shown.at(-1)).toEqual([SILO.id, DEVS.id]));
  });

  it('should leave a show whose Drop is kept after a failed refetch out, with no date to list it by', async () => {
    servePaged({ url: WATCHED_PROGRESS_URL, body: [DEVS_ROW, SILO_ROW] });
    const { reading, drop, waitForLateRequests } = await renderStore(() => ({
      ...droppedItems({}).store(),
      drop: useDrop(SILO_DROP_SHOW).drop,
      waitForLateRequests: useWaitForLateRequests(),
    }));
    const shown = shownIdsOf(reading);
    await vi.waitFor(() => expect(shown.at(-1)).toEqual([DEVS.id]));

    failOnce(DROPPED_URL);
    expect(await drop()).toBe(true);
    await waitForLateRequests();

    expect(shown).not.toContainEqual(expect.arrayContaining([SILO.id]));
    expect(shown.at(-1)).toEqual([DEVS.id]);
  });
});
