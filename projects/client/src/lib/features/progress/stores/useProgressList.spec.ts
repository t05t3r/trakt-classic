import { useDrop } from '$lib/features/media-actions/stores/useDrop.ts';
import { useHistoryItems } from '$lib/features/history/stores/useHistoryItems.ts';
import { PROGRESS_SORTS } from '$lib/features/progress/PROGRESS_SORTS.ts';
import { watchedShowsProgressQuery } from '$lib/requests/queries/sync/watchedShowsProgressQuery.ts';
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
import { DROP_URL } from '$mocks/data/users/DROP_URL.ts';
import { DROPPED_URL } from '$mocks/data/users/DROPPED_URL.ts';
import { RESTORE_URL } from '$mocks/data/users/RESTORE_URL.ts';
import { answerDialog } from '$test/beds/dialogs/answerDialog.ts';
import { kindsOf } from '$test/beds/query/kindsOf.ts';
import { nextOf } from '$test/beds/query/nextOf.ts';
import { useWaitForLateRequests } from '$test/beds/query/useWaitForLateRequests.ts';
import { useWaitForQueriesIdle } from '$test/beds/query/useWaitForQueriesIdle.ts';
import { failOnce } from '$test/beds/request/failOnce.ts';
import { holdPost } from '$test/beds/request/holdPost.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { pagedResponse } from '$test/beds/request/pagedResponse.ts';
import { recordSearches } from '$test/beds/request/recordSearches.ts';
import { servePaged } from '$test/beds/request/servePaged.ts';
import { serveTwoPages } from '$test/beds/request/serveTwoPages.ts';
import { watchedProgressRow } from '$test/beds/request/watchedProgressRow.ts';
import { pagedItemsOf } from '$test/beds/store/pagedItemsOf.ts';
import { readingOf } from '$test/beds/store/readingOf.ts';
import { readyIdsOf } from '$test/beds/store/readyIdsOf.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { shownIdsOf } from '$test/beds/store/shownIdsOf.ts';
import { statusOf } from '$test/beds/store/statusOf.ts';
import { describe, expect, it, vi } from 'vitest';
import { type ProgressListValues, useProgressList } from './useProgressList.ts';

const { by, how } = assertDefined(PROGRESS_SORTS.watched.at(0));

const VALUES: ProgressListValues = {
  filters: { view: 'watched', sort: { by, how } },
  watched: null,
  show: null,
  page: 1,
};

const showOf = (id: number) => ({
  ...ShowSiloResponseMock,
  ids: { ...ShowSiloResponseMock.ids, trakt: id },
});

const OTHER = showOf(99);

const SILO_ROW = watchedProgressRow({
  show: ShowSiloResponseMock,
  lastWatchedAt: LATEST_WATCHED_AT,
});

const progressList = pagedItemsOf(useProgressList, VALUES);

describe('store: useProgressList', () => {
  it.each([
    {
      held: 'the dropped list',
      url: DROPPED_URL,
      known: watchedShowsProgressQuery(),
    },
    {
      held: 'the rows',
      url: WATCHED_PROGRESS_URL,
      known: droppedShowsQuery({ limit: 1 }),
    },
  ])(
    'should read loading while $held is not known, then ready',
    async ({ url, known }) => {
      servePaged({
        url: WATCHED_PROGRESS_URL,
        body: [SILO_ROW],
      });
      const held = holdRequest({ method: 'get', url });
      const { reading, waitForQueriesIdle } = await renderStore(() => ({
        ...progressList({}).store(),
        waitForQueriesIdle: useWaitForQueriesIdle(),
      }));
      const kinds = kindsOf(statusOf(reading));

      await held.requested;
      await waitForQueriesIdle({ queryKey: [known.queryKey.at(0)] });
      expect(kinds).toEqual(['loading']);

      held.release();
      await nextOf(statusOf(reading), 'ready');
      expect(kinds).toEqual(['loading', 'ready']);
    },
  );

  it.each([
    { name: 'the rows', url: WATCHED_PROGRESS_URL },
    { name: 'the dropped list', url: DROPPED_URL },
  ])(
    'should read a failed read of $name as error, and land the rows on Retry',
    async ({ url }) => {
      servePaged({
        url: WATCHED_PROGRESS_URL,
        body: [SILO_ROW],
      });
      failOnce(url);
      const { reading } = await renderStore(progressList({}).store);

      const failed = await nextOf(statusOf(reading), 'error');
      failed.retry();

      expect(await readyIdsOf(reading)).toEqual([SILO.id]);
    },
  );

  it('should read no rows as empty', async () => {
    servePaged({ url: WATCHED_PROGRESS_URL, body: [] });
    const { reading } = await renderStore(progressList({}).store);
    const kinds = kindsOf(statusOf(reading));

    await nextOf(statusOf(reading), 'empty');

    expect(kinds).toEqual(['loading', 'empty']);
  });

  it("should read loading, then a row per show with the show's card, the count and the cover", async () => {
    servePaged({
      url: WATCHED_PROGRESS_URL,
      body: [SILO_ROW],
    });
    const { reading } = await renderStore(progressList({}).store);
    const kinds = kindsOf(statusOf(reading));

    const ready = await nextOf(statusOf(reading), 'ready');

    expect(kinds).toEqual(['loading', 'ready']);
    expect(ready.data.map(({ card }) => [card.target.type, card.target.id]))
      .toEqual([['show', SILO.id]]);
    expect(await readingOf(reading, 'itemCount')).toBe(1);
    expect(await readingOf(reading, 'cover')).toBe(
      ready.data.at(0)?.entry.show.cover.url.full,
    );
  });

  it('should clamp a page past the last', async () => {
    servePaged({
      url: WATCHED_PROGRESS_URL,
      body: [SILO_ROW],
    });
    const { store, replacePage } = progressList({ page: 3 });
    const { reading } = await renderStore(store);
    const kinds = kindsOf(statusOf(reading));

    await vi.waitFor(() => expect(replacePage).toHaveBeenCalledWith(1));

    expect(kinds).toEqual(['loading']);
  });

  it('should list only the show it narrows to, and sum the header over that row', async () => {
    servePaged({
      url: WATCHED_PROGRESS_URL,
      body: [
        watchedProgressRow({
          show: OTHER,
          lastWatchedAt: LATEST_WATCHED_AT,
          aired: 8,
          completed: 8,
        }),
        watchedProgressRow({
          show: ShowSiloResponseMock,
          lastWatchedAt: LATEST_WATCHED_AT,
          aired: 10,
          completed: 4,
          minutesLeft: 300,
        }),
      ],
    });
    const { reading } = await renderStore(
      progressList({ show: SILO.id }).store,
    );

    expect(await readyIdsOf(reading)).toEqual([SILO.id]);
    expect(await readingOf(reading, 'stats')).toEqual({
      completed: 4,
      aired: 10,
      minutesLeft: 300,
      shows: 1,
    });
  });

  it.each(
    [
      { watched: 'fade', faded: [false, true] },
      { watched: 'hide', faded: [false, false] },
      { watched: null, faded: [false, false] },
    ] as const,
  )(
    'should fade the complete rows only under fade, under $watched',
    async ({ watched, faded }) => {
      servePaged({
        url: WATCHED_PROGRESS_URL,
        body: [
          watchedProgressRow({
            show: ShowSiloResponseMock,
            lastWatchedAt: LATEST_WATCHED_AT,
            aired: 10,
            completed: 4,
          }),
          watchedProgressRow({
            show: OTHER,
            lastWatchedAt: LATEST_WATCHED_AT,
            aired: 8,
            completed: 8,
          }),
        ],
      });
      const { reading } = await renderStore(progressList({ watched }).store);

      const ready = await nextOf(statusOf(reading), 'ready');

      expect(ready.data.map(({ isFaded }) => isFaded)).toEqual(faded);
    },
  );

  it.each(
    [
      { watched: 'hide', hideCompleted: 'true' },
      { watched: 'fade', hideCompleted: undefined },
      { watched: null, hideCompleted: undefined },
    ] as const,
  )(
    'should request the resolved sort, and hide_completed only under hide, under $watched',
    async ({ watched, hideCompleted }) => {
      const searches = recordSearches(WATCHED_PROGRESS_URL, []);
      const { reading } = await renderStore(progressList({ watched }).store);

      await readingOf(reading, 'entries');
      const [search] = searches.map((search) => Object.fromEntries(search));

      expect(search).toEqual(
        expect.objectContaining({ sort_by: 'added', sort_how: 'desc' }),
      );
      expect(search?.hide_completed).toBe(hideCompleted);
    },
  );

  it('should request the first page whatever page the list is at', async () => {
    const searches = recordSearches(WATCHED_PROGRESS_URL, []);
    const { reading } = await renderStore(progressList({ page: 3 }).store);

    await readingOf(reading, 'entries');

    expect(searches.map((search) => search.get('page'))).toEqual(['1']);
  });

  it('should leave a dropped show and a show whose Drop is pending, or kept after a failed refetch, out of the rows and the sums', async () => {
    servePaged({
      url: WATCHED_PROGRESS_URL,
      body: [
        watchedProgressRow({
          show: ShowDevsResponseMock,
          lastWatchedAt: LATEST_WATCHED_AT,
          aired: 8,
          completed: 5,
        }),
        watchedProgressRow({
          show: ShowSiloResponseMock,
          lastWatchedAt: LATEST_WATCHED_AT,
          aired: 10,
          completed: 10,
        }),
        watchedProgressRow({
          show: OTHER,
          lastWatchedAt: LATEST_WATCHED_AT,
          aired: 6,
          completed: 2,
        }),
      ],
    });
    const rows = holdRequest({ method: 'get', url: WATCHED_PROGRESS_URL });
    const dropping = holdPost(DROP_URL);
    const { reading, drop, waitForLateRequests } = await renderStore(() => ({
      ...progressList({}).store(),
      drop: useDrop(SILO_DROP_SHOW).drop,
      waitForLateRequests: useWaitForLateRequests(),
    }));
    const shown = shownIdsOf(reading);

    const dropped = drop();
    await dropping.requested;
    rows.release();

    expect(await readyIdsOf(reading)).toEqual([OTHER.ids.trakt]);
    expect(await readingOf(reading, 'stats')).toEqual({
      completed: 2,
      aired: 6,
      minutesLeft: 0,
      shows: 1,
    });

    failOnce(DROPPED_URL);
    dropping.release();
    expect(await dropped).toBe(true);
    await waitForLateRequests();

    expect(shown.at(-1)).toEqual([OTHER.ids.trakt]);
    expect(await readingOf(reading, 'stats')).toEqual({
      completed: 2,
      aired: 6,
      minutesLeft: 0,
      shows: 1,
    });
  });

  it('should list a dropped show whose Restore is pending, and sum it', async () => {
    servePaged({
      url: WATCHED_PROGRESS_URL,
      body: [
        watchedProgressRow({
          show: ShowDevsResponseMock,
          lastWatchedAt: LATEST_WATCHED_AT,
          aired: 8,
          completed: 5,
        }),
        watchedProgressRow({
          show: OTHER,
          lastWatchedAt: LATEST_WATCHED_AT,
          aired: 6,
          completed: 2,
        }),
      ],
    });
    const rows = holdRequest({ method: 'get', url: WATCHED_PROGRESS_URL });
    const restoring = holdPost(RESTORE_URL);
    const { reading, restore } = await renderStore(() => ({
      ...progressList({}).store(),
      restore: useDrop(DEVS_DROP_SHOW).restore,
    }));

    const restored = restore();
    await answerDialog('Restore this show?', 'Yes, restore it!');
    await restoring.requested;
    rows.release();

    expect(await readyIdsOf(reading)).toEqual([DEVS.id, OTHER.ids.trakt]);
    expect(await readingOf(reading, 'stats')).toEqual({
      completed: 7,
      aired: 14,
      minutesLeft: 0,
      shows: 2,
    });

    restoring.release();
    await restored;
  });

  describe('with shows never watched among the rows', () => {
    const ROWS = [
      watchedProgressRow({ show: showOf(1), lastWatchedAt: null }),
      watchedProgressRow({
        show: showOf(2),
        lastWatchedAt: '2025-01-20T10:00:00.000Z',
      }),
      watchedProgressRow({
        show: showOf(3),
        lastWatchedAt: '2025-01-10T10:00:00.000Z',
      }),
      watchedProgressRow({ show: showOf(4), lastWatchedAt: null }),
      watchedProgressRow({ show: showOf(5), lastWatchedAt: LATEST_WATCHED_AT }),
    ];

    it.each(['asc', 'desc'] as const)(
      'should list them after the dated rows, in served order, under Watched Date %s',
      async (direction) => {
        servePaged({ url: WATCHED_PROGRESS_URL, body: ROWS });
        const { reading } = await renderStore(
          progressList({
            filters: {
              view: 'watched',
              sort: { by: 'added', how: direction },
            },
          }).store,
        );

        expect(await readyIdsOf(reading)).toEqual([2, 3, 5, 1, 4]);
      },
    );

    it('should keep the served order under another sort', async () => {
      servePaged({ url: WATCHED_PROGRESS_URL, body: ROWS });
      const { reading } = await renderStore(
        progressList({
          filters: { view: 'watched', sort: { by: 'title', how: 'asc' } },
        }).store,
      );

      expect(await readyIdsOf(reading)).toEqual([1, 2, 3, 4, 5]);
    });
  });

  it('should give a show served on two pages one row', async () => {
    serveTwoPages({
      url: WATCHED_PROGRESS_URL,
      first: [SILO_ROW],
      second: () =>
        pagedResponse({
          body: [
            SILO_ROW,
            watchedProgressRow({
              show: OTHER,
              lastWatchedAt: LATEST_WATCHED_AT,
            }),
          ],
          page: 2,
          pageCount: 2,
        }),
    });
    const { reading } = await renderStore(progressList({}).store);

    expect(await readyIdsOf(reading)).toEqual([SILO.id, OTHER.ids.trakt]);
  });

  it("should share one read with History's Shows view at the default view", async () => {
    const searches = recordSearches(WATCHED_PROGRESS_URL, []);
    const { progress, history, waitForLateRequests } = await renderStore(
      () => ({
        progress: progressList({}).store().reading,
        history: useHistoryItems({
          values: {
            type: 'shows',
            item: null,
            genres: null,
            range: {},
            page: 1,
          },
          replacePage: vi.fn(),
        }),
        waitForLateRequests: useWaitForLateRequests(),
      }),
    );

    await Promise.all([
      readingOf(progress, 'entries'),
      readingOf(history, 'entries'),
    ]);
    await waitForLateRequests();

    expect(searches).toHaveLength(1);
  });
});
