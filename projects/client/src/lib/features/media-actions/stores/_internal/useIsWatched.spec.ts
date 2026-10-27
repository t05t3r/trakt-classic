import { useUser } from '$lib/features/auth/stores/useUser.ts';
import { useWatched } from '$lib/features/media-actions/stores/useWatched.ts';
import { pendingOverrides } from '$lib/features/media-actions/_internal/pendingOverrides.ts';
import { toTargetKey } from '$lib/features/media-actions/_internal/toTargetKey.ts';
import type { MediaStoreProps } from '$lib/models/MediaStoreProps.ts';
import { DEVS } from '$mocks/data/media-actions/DEVS.ts';
import { HERETIC } from '$mocks/data/media-actions/HERETIC.ts';
import { SILO } from '$mocks/data/media-actions/SILO.ts';
import { UNWATCHED_MOVIE } from '$mocks/data/media-actions/UNWATCHED_MOVIE.ts';
import { WatchedMoviesResponseMock } from '$mocks/data/users/response/WatchedMoviesResponseMock.ts';
import { WATCHED_MOVIES_QUERIES } from '$mocks/data/users/WATCHED_MOVIES_QUERIES.ts';
import { WATCHED_MOVIES_URL } from '$mocks/data/users/WATCHED_MOVIES_URL.ts';
import { WATCHED_SHOWS_QUERIES } from '$mocks/data/users/WATCHED_SHOWS_QUERIES.ts';
import { server } from '$mocks/server.ts';
import { useWaitForLateRequests } from '$test/beds/query/useWaitForLateRequests.ts';
import { useWaitForQueriesIdle } from '$test/beds/query/useWaitForQueriesIdle.ts';
import { useWaitForUnobserved } from '$test/beds/query/useWaitForUnobserved.ts';
import { captureRequests } from '$test/beds/request/captureRequests.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { holdResponse } from '$test/beds/request/holdResponse.ts';
import { pagedResponse } from '$test/beds/request/pagedResponse.ts';
import { serveTwoPages } from '$test/beds/request/serveTwoPages.ts';
import { collectDistinctStates } from '$test/beds/store/collectDistinctStates.ts';
import { renderSettledHistory } from '$test/beds/store/renderSettledHistory.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { http, HttpResponse } from 'msw';
import { filter, firstValueFrom } from 'rxjs';
import { afterEach, describe, expect, it } from 'vitest';
import { type IsWatchedProps, useIsWatched } from './useIsWatched.ts';

const SEVERAL: MediaStoreProps = {
  type: 'movie',
  media: [{ id: HERETIC.id }, { id: UNWATCHED_MOVIE.media.id }],
};
const HERETIC_OVERRIDE = {
  action: 'watched',
  targetKey: toTargetKey('movie', HERETIC.id),
  requestId: 'request',
} as const;

function holdHistory() {
  holdRequest({
    method: 'get',
    url: WATCHED_MOVIES_URL,
    answer: () => pagedResponse({ body: WatchedMoviesResponseMock }),
  });
}

const UNWATCHED_OVERRIDE = {
  ...HERETIC_OVERRIDE,
  targetKey: toTargetKey('movie', UNWATCHED_MOVIE.media.id),
} as const;

async function readIsWatched(props: IsWatchedProps) {
  const { isWatched } = await renderSettledHistory(() => useIsWatched(props));

  return firstValueFrom(isWatched);
}

describe('store: useIsWatched', () => {
  afterEach(() => {
    pendingOverrides.clear(HERETIC_OVERRIDE);
    pendingOverrides.clear(UNWATCHED_OVERRIDE);
  });

  describe('watched snapshot', () => {
    it.each([
      { id: HERETIC.id, expected: true },
      { id: UNWATCHED_MOVIE.media.id, expected: false },
    ])(
      'should read movie $id as watched: $expected',
      async ({ id, expected }) => {
        expect(await readIsWatched({ type: 'movie', media: { id } }))
          .toBe(expected);
      },
    );

    it.each([
      { id: 1, expected: true },
      { id: 2, expected: false },
    ])(
      'should read episode $id of Silo as watched: $expected',
      async ({ id, expected }) => {
        expect(
          await readIsWatched({
            type: 'episode',
            media: { id, season: 1, number: id },
            show: { id: SILO.id, title: 'Silo' },
          }),
        ).toBe(expected);
      },
    );

    it.each([
      { count: 1, expected: true },
      { count: 10, expected: false },
    ])(
      'should read Silo with $count episodes as watched: $expected',
      async ({ count, expected }) => {
        expect(
          await readIsWatched({
            type: 'show',
            media: { id: SILO.id, episode: { count } },
          }),
        ).toBe(expected);
      },
    );
  });

  describe('watched snapshot of a season', () => {
    it.each([
      { show: DEVS.id, aired: 8, expected: true },
      { show: DEVS.id, aired: 9, expected: false },
      { show: SILO.id, aired: 10, expected: false },
      { show: SILO.id, aired: 1, expected: true },
      { show: SILO.id, aired: 0, expected: false },
    ])(
      'should read season 1 of show $show with $aired aired episodes as watched: $expected',
      async ({ show, aired, expected }) => {
        expect(
          await readIsWatched({
            type: 'season',
            media: { id: 1, number: 1, episodes: { count: 10, aired } },
            show: { id: show },
          }),
        ).toBe(expected);
      },
    );

    it('should read a season of a show with no plays as unwatched', async () => {
      expect(
        await readIsWatched({
          type: 'season',
          media: { id: 1, number: 1, episodes: { count: 10, aired: 10 } },
          show: { id: 999_999 },
        }),
      ).toBe(false);
    });
  });

  describe('cached history', () => {
    it(
      'should read the cached watched state, with no refetch, for a fresh subscriber once the history has no observer left',
      async () => {
        const {
          heretic,
          unwatched,
          history,
          waitForUnobserved,
          waitForLateRequests,
        } = await renderStore(() => ({
          heretic: useIsWatched({ type: 'movie', media: { id: HERETIC.id } }),
          unwatched: useIsWatched(UNWATCHED_MOVIE),
          history: useUser().history,
          waitForUnobserved: useWaitForUnobserved(),
          waitForLateRequests: useWaitForLateRequests(),
        }));
        await firstValueFrom(
          history.pipe(filter(($history) => $history !== null)),
        );
        await Promise.all([
          waitForUnobserved(WATCHED_MOVIES_QUERIES),
          waitForUnobserved(WATCHED_SHOWS_QUERIES),
        ]);

        const requests = await captureRequests(async () => {
          const states = {
            heretic: collectDistinctStates(heretic.isWatched),
            unwatched: collectDistinctStates(unwatched.isWatched),
          };
          await waitForLateRequests();

          expect(states).toEqual({ heretic: [true], unwatched: [false] });
        });

        expect(requests).toEqual([]);
      },
      10_000,
    );
  });

  describe('no targets', () => {
    it('should read an empty list as not watched and not updating', async () => {
      const { isWatched, isUpdating } = await renderStore(() =>
        useIsWatched({ type: 'movie', media: [] })
      );

      expect(await firstValueFrom(isWatched)).toBe(false);
      expect(await firstValueFrom(isUpdating)).toBe(false);
    });
  });

  describe('loading signal', () => {
    it('should read a Target as not known while the history loads', async () => {
      holdHistory();
      const { isWatched } = await renderStore(() =>
        useIsWatched({ type: 'movie', media: { id: HERETIC.id } })
      );

      expect(await firstValueFrom(isWatched)).toBeUndefined();
    });

    it('should read the history as not known while an add grows it past one page', async () => {
      server.use(
        http.get(
          WATCHED_MOVIES_URL,
          () => pagedResponse({ body: WatchedMoviesResponseMock }),
        ),
      );
      const { heretic, unwatched } = await renderSettledHistory(() => ({
        heretic: useIsWatched({ type: 'movie', media: { id: HERETIC.id } }),
        unwatched: useWatched(UNWATCHED_MOVIE),
      }));
      const states = collectDistinctStates(heretic.isWatched);
      const secondPage = holdResponse(() =>
        pagedResponse({ body: {}, page: 2, pageCount: 2 })
      );
      serveTwoPages({
        url: WATCHED_MOVIES_URL,
        first: WatchedMoviesResponseMock,
        second: secondPage.answer,
      });

      const adding = unwatched.add();
      await secondPage.requested;
      const whileFetching = await firstValueFrom(heretic.isWatched);
      secondPage.release();
      await adding;

      expect(whileFetching).toBeUndefined();
      expect(states).toEqual([true, undefined, true]);
    });

    it('should turn not known when an add grows it past one page and that page fails', async () => {
      server.use(
        http.get(
          WATCHED_MOVIES_URL,
          () => pagedResponse({ body: WatchedMoviesResponseMock }),
        ),
      );
      const { heretic, unwatched, waitForQueriesIdle } =
        await renderSettledHistory(() => ({
          heretic: useIsWatched({ type: 'movie', media: { id: HERETIC.id } }),
          unwatched: useWatched(UNWATCHED_MOVIE),
          waitForQueriesIdle: useWaitForQueriesIdle(),
        }));
      expect(await firstValueFrom(heretic.isWatched)).toBe(true);
      const secondPage = holdResponse(() =>
        new HttpResponse(null, { status: 500 })
      );
      secondPage.release();
      serveTwoPages({
        url: WATCHED_MOVIES_URL,
        first: WatchedMoviesResponseMock,
        second: secondPage.answer,
      });

      await unwatched.add();
      await secondPage.requested;
      await waitForQueriesIdle(WATCHED_MOVIES_QUERIES);

      expect(await firstValueFrom(heretic.isWatched)).toBeUndefined();
    });
  });

  describe('several targets', () => {
    it('should read as not watched when any target reads not watched', async () => {
      expect(await readIsWatched(SEVERAL)).toBe(false);
    });

    it('should read as watched when every target reads watched', async () => {
      pendingOverrides.set({ ...HERETIC_OVERRIDE, value: true });
      pendingOverrides.set({ ...UNWATCHED_OVERRIDE, value: true });

      expect(await readIsWatched(SEVERAL)).toBe(true);
    });

    it('should read as not watched while another target is not known', async () => {
      holdHistory();
      pendingOverrides.set({ ...HERETIC_OVERRIDE, value: false });
      const { isWatched } = await renderStore(() => useIsWatched(SEVERAL));

      expect(await firstValueFrom(isWatched)).toBe(false);
    });

    it('should read as not known when no target reads not watched and one is not known', async () => {
      holdHistory();
      pendingOverrides.set({ ...HERETIC_OVERRIDE, value: true });
      const { isWatched } = await renderStore(() => useIsWatched(SEVERAL));

      expect(await firstValueFrom(isWatched)).toBeUndefined();
    });
  });

  describe('pending override', () => {
    it('should read the override before the snapshot', async () => {
      pendingOverrides.set({ ...HERETIC_OVERRIDE, value: false });

      expect(await readIsWatched({ type: 'movie', media: { id: HERETIC.id } }))
        .toBe(false);
    });
  });
});
