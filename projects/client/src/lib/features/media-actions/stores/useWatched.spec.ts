import { useUser } from '$lib/features/auth/stores/useUser.ts';
import { useInvalidator } from '$lib/features/query/useInvalidator.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import type { Season } from '$lib/requests/models/Season.ts';
import type { ShowEntry } from '$lib/requests/models/ShowEntry.ts';
import { showProgressQuery } from '$lib/requests/queries/shows/showProgressQuery.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { SILO_EPISODE } from '$mocks/data/media-actions/SILO_EPISODE.ts';
import { UNWATCHED_MOVIE } from '$mocks/data/media-actions/UNWATCHED_MOVIE.ts';
import { SILO_PROGRESS_URL } from '$mocks/data/shows/SILO_PROGRESS_URL.ts';
import { ShowDevsMappedMock } from '$mocks/data/summary/shows/devs/ShowDevsMappedMock.ts';
import { ShowDevsProgressMappedMock } from '$mocks/data/summary/shows/devs/mapped/ShowDevsProgressMappedMock.ts';
import { ShowDevsSeasonEpisodesMappedMock } from '$mocks/data/summary/shows/devs/mapped/ShowDevsSeasonEpisodesMappedMock.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { ShowSiloSeasonsMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloSeasonsMappedMock.ts';
import { ShowSiloProgressResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloProgressResponseMock.ts';
import { SYNC_HISTORY_REMOVE_URL } from '$mocks/data/sync/SYNC_HISTORY_REMOVE_URL.ts';
import { SYNC_HISTORY_URL } from '$mocks/data/sync/SYNC_HISTORY_URL.ts';
import { WatchedMoviesMappedMock } from '$mocks/data/users/mapped/WatchedMoviesMappedMock.ts';
import { WatchedShowsMappedMock } from '$mocks/data/users/mapped/WatchedShowsMappedMock.ts';
import { WatchedMoviesResponseMock } from '$mocks/data/users/response/WatchedMoviesResponseMock.ts';
import { WatchedShowsSiloResponseMock } from '$mocks/data/users/response/WatchedShowsSiloResponseMock.ts';
import { WATCHED_MOVIES_QUERIES } from '$mocks/data/users/WATCHED_MOVIES_QUERIES.ts';
import { WATCHED_MOVIES_URL } from '$mocks/data/users/WATCHED_MOVIES_URL.ts';
import { WATCHED_SHOWS_QUERIES } from '$mocks/data/users/WATCHED_SHOWS_QUERIES.ts';
import { WATCHED_SHOWS_URL } from '$mocks/data/users/WATCHED_SHOWS_URL.ts';
import { server } from '$mocks/server.ts';
import { answerDialog } from '$test/beds/dialogs/answerDialog.ts';
import { setNetwork } from '$test/beds/network/setNetwork.ts';
import { settleWithin } from '$test/beds/promise/settleWithin.ts';
import { useObserverApart } from '$test/beds/query/useObserverApart.ts';
import { useWaitForQueriesIdle } from '$test/beds/query/useWaitForQueriesIdle.ts';
import { useWaitForLateRequests } from '$test/beds/query/useWaitForLateRequests.ts';
import { useWaitForUnobserved } from '$test/beds/query/useWaitForUnobserved.ts';
import { captureRequests } from '$test/beds/request/captureRequests.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { holdResponse } from '$test/beds/request/holdResponse.ts';
import { pagedResponse } from '$test/beds/request/pagedResponse.ts';
import { serveTwoPages } from '$test/beds/request/serveTwoPages.ts';
import { collectDistinctStates } from '$test/beds/store/collectDistinctStates.ts';
import { readKnown } from '$test/beds/store/readKnown.ts';
import { renderSettledHistory } from '$test/beds/store/renderSettledHistory.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { screen, within } from '@testing-library/svelte';
import { http, HttpResponse } from 'msw';
import { filter, firstValueFrom } from 'rxjs';
import {
  afterEach,
  describe,
  expect,
  expectTypeOf,
  it,
  onTestFinished,
} from 'vitest';
import { useWatched, type WatchedStoreProps } from './useWatched.ts';

function seasonTarget(
  show: Pick<ShowEntry, 'id' | 'title'>,
  { id, number, episodes }: Pick<Season, 'id' | 'number' | 'episodes'>,
) {
  return {
    type: 'season',
    media: { id, number, episodes },
    show: { id: show.id, title: show.title },
  } satisfies WatchedStoreProps;
}

const HERETIC = {
  type: 'movie',
  media: { id: 916302, title: 'Heretic' },
} satisfies WatchedStoreProps;
const SILO = {
  type: 'show',
  media: { id: 180770, slug: 'silo', title: 'Silo', episode: { count: 17 } },
} satisfies WatchedStoreProps;
const SILO_HISTORY = assertDefined(
  WatchedShowsMappedMock.find(({ id }) => id === SILO.media.id),
);
const NO_MOVIES: WatchedStoreProps = { type: 'movie', media: [] };
const SILO_FIRST_SEASON = seasonTarget(
  ShowSiloMappedMock,
  assertDefined(ShowSiloSeasonsMappedMock.at(0)),
);
const SILO_SECOND_SEASON = seasonTarget(
  ShowSiloMappedMock,
  assertDefined(ShowSiloSeasonsMappedMock.at(1)),
);
const DEVS_PROGRESS_SEASON = assertDefined(
  ShowDevsProgressMappedMock.seasons.at(0),
);
const DEVS_FIRST_SEASON = seasonTarget(ShowDevsMappedMock, {
  id: 1001,
  number: DEVS_PROGRESS_SEASON.number,
  episodes: {
    count: ShowDevsSeasonEpisodesMappedMock.length,
    aired: DEVS_PROGRESS_SEASON.total,
  },
});
const SILO_FIRST_SEASON_PROMPT =
  'Mark all 10 aired episodes of "Season 1 of Silo" as watched? Episodes already watched get another play.';

const REFUSED_TOAST = 'Your history changed. Try again.';

function episodeStores() {
  return {
    episode: useWatched(SILO_EPISODE),
    unwatched: useWatched(UNWATCHED_MOVIE),
    waitForQueriesIdle: useWaitForQueriesIdle(),
    invalidate: useInvalidator().invalidate,
  };
}

// The shows history holds the episode's play, so only the unknown movies history stops a write.
async function renderEpisode() {
  const store = await renderStore(() => ({
    ...episodeStores(),
    history: useUser().history,
  }));
  const subscription = store.history.subscribe();
  onTestFinished(() => subscription.unsubscribe());
  await store.waitForQueriesIdle(WATCHED_SHOWS_QUERIES);

  return store;
}

// Fails the watched movies from `failedPage` on; resolves on the first failing request.
function failMovies(failedPage = 1): Promise<void> {
  const failure = holdResponse(() => new HttpResponse(null, { status: 500 }));
  failure.release();
  server.use(
    http.get(WATCHED_MOVIES_URL, ({ request }) => {
      const page = Number(new URL(request.url).searchParams.get('page') ?? 1);
      if (page < failedPage) {
        return pagedResponse({ body: WatchedMoviesResponseMock, pageCount: 2 });
      }

      return failure.answer();
    }),
  );

  return failure.requested;
}

// Waits out the retries of a failure the spec saw requested.
async function settleFailure(
  waitForQueriesIdle: ReturnType<typeof useWaitForQueriesIdle>,
  failed: Promise<void>,
) {
  await failed;
  await waitForQueriesIdle(WATCHED_MOVIES_QUERIES);
}

async function renderFailedMovies(failedPage: number) {
  const failed = failMovies(failedPage);
  const { episode, waitForQueriesIdle } = await renderEpisode();
  await settleFailure(waitForQueriesIdle, failed);

  return episode;
}

async function renderSettledMovies() {
  server.use(
    http.get(
      WATCHED_MOVIES_URL,
      () => pagedResponse({ body: WatchedMoviesResponseMock }),
    ),
  );

  return renderSettledHistory(episodeStores);
}

const UNKNOWN_HISTORY: ReadonlyArray<{
  name: string;
  reach: () => Promise<ReturnType<typeof useWatched>>;
}> = [
  {
    name: 'while it loads',
    reach: async () => {
      holdRequest({
        method: 'get',
        url: WATCHED_MOVIES_URL,
        answer: () => pagedResponse({ body: WatchedMoviesResponseMock }),
      });
      const { episode } = await renderEpisode();

      return episode;
    },
  },
  { name: 'when its first page fails', reach: () => renderFailedMovies(1) },
  { name: 'when a further page fails', reach: () => renderFailedMovies(2) },
  {
    name: 'when a refetch of a loaded page fails',
    reach: async () => {
      const { episode, unwatched, waitForQueriesIdle } =
        await renderSettledMovies();
      const failed = failMovies();
      await unwatched.add();
      await settleFailure(waitForQueriesIdle, failed);

      return episode;
    },
  },
  {
    name: 'while a write grows it past one page',
    reach: async () => {
      const { episode, unwatched } = await renderSettledMovies();
      const secondPage = holdResponse(() =>
        pagedResponse({ body: {}, page: 2, pageCount: 2 })
      );
      serveTwoPages({
        url: WATCHED_MOVIES_URL,
        first: WatchedMoviesResponseMock,
        second: secondPage.answer,
      });

      void unwatched.add();
      await secondPage.requested;

      return episode;
    },
  },
];

describe('store: useWatched', () => {
  describe('props', () => {
    it('should take a movie or an episode without a slug', () => {
      expectTypeOf<{ type: 'movie'; media: { id: number; title: string } }>()
        .toExtend<WatchedStoreProps>();
      expectTypeOf<{
        type: 'episode';
        media: { id: number; title: string; season: number; number: number };
        show: { id: number; title: string };
      }>().toExtend<WatchedStoreProps>();
    });

    it('should require a slug and an episode count on a show', () => {
      expectTypeOf<{
        type: 'show';
        media: { id: number; title: string; episode: { count: number } };
      }>().not.toExtend<WatchedStoreProps>();
      expectTypeOf<{
        type: 'show';
        media: { id: number; slug: string; title: string };
      }>().not.toExtend<WatchedStoreProps>();
    });
  });

  describe('watched snapshot', () => {
    it.each(
      [
        {
          name: 'a movie',
          props: HERETIC,
          expected: 1,
        },
        {
          name: 'a show, summed over its episodes',
          props: {
            type: 'show',
            media: {
              id: 147971,
              slug: 'show',
              title: 'Show',
              episode: { count: 20 },
            },
          },
          expected: 11,
        },
        {
          name: 'an episode',
          props: {
            type: 'episode',
            media: { id: 2, title: 'Episode', season: 1, number: 2 },
            show: { id: 147971, title: 'Show' },
          },
          expected: 3,
        },
      ] satisfies Array<
        { name: string; props: WatchedStoreProps; expected: number }
      >,
    )(
      'should count the plays of $name',
      async ({ props, expected }) => {
        const { plays } = await renderStore(() => useWatched(props));

        expect(await firstValueFrom(plays)).toBe(expected);
      },
    );

    it.each(
      [
        {
          name: 'a movie',
          props: HERETIC,
          expected: assertDefined(
            WatchedMoviesMappedMock.find(({ id }) => id === HERETIC.media.id),
          ).watchedAt,
        },
        { name: 'a show', props: SILO, expected: SILO_HISTORY.watchedAt },
        {
          name: 'an episode',
          props: SILO_EPISODE,
          expected: assertDefined(
            SILO_HISTORY.episodes.find(({ episodeId }) =>
              episodeId === SILO_EPISODE.media.id
            ),
          ).watchedAt,
        },
      ] satisfies Array<
        { name: string; props: WatchedStoreProps; expected: Date }
      >,
    )(
      'should read the last play of $name',
      async ({ props, expected }) => {
        const { lastWatchedAt } = await renderStore(() => useWatched(props));

        expect(await firstValueFrom(lastWatchedAt)).toEqual(expected);
      },
    );

    it('should read the latest play of several targets', async () => {
      server.use(
        http.get(WATCHED_MOVIES_URL, () =>
          pagedResponse({
            body: {
              '1': ['2024-01-10T20:00:00.000Z'],
              '2': ['2024-03-10T20:00:00.000Z', '2024-02-10T20:00:00.000Z'],
              '3': ['2024-02-20T20:00:00.000Z'],
            },
          })),
      );
      const { lastWatchedAt } = await renderStore(() =>
        useWatched({
          type: 'movie',
          media: [
            { id: 1, title: 'One' },
            { id: 2, title: 'Two' },
            { id: 3, title: 'Three' },
          ],
        })
      );

      expect(await firstValueFrom(lastWatchedAt)).toEqual(
        new Date('2024-03-10T20:00:00.000Z'),
      );
    });

    it('should read no last play for a target never watched', async () => {
      const { lastWatchedAt } = await renderStore(() =>
        useWatched(UNWATCHED_MOVIE)
      );

      expect(await firstValueFrom(lastWatchedAt)).toBeUndefined();
    });
  });

  describe('watched state', () => {
    it('should read not known before the history first settles', async () => {
      holdRequest({ method: 'get', url: WATCHED_MOVIES_URL });
      const { isWatched } = await renderStore(() => useWatched(HERETIC));

      expect(await firstValueFrom(isWatched)).toBeUndefined();
    });

    it('should keep the last known state, and send nothing, while the history refetches', async () => {
      const { watched, writer } = await renderSettledHistory(() => ({
        watched: useWatched(HERETIC),
        writer: useWatched(UNWATCHED_MOVIE),
      }));
      const states = collectDistinctStates(watched.isWatched);
      const refetch = holdRequest({ method: 'get', url: WATCHED_MOVIES_URL });

      const added = writer.add();
      await refetch.requested;
      const whileRefetching = await captureRequests(() => watched.add());
      refetch.release();
      await added;

      expect(whileRefetching).toEqual([]);
      expect(states).toEqual([true]);
    });

    it('should read not known, keeping the last known state, after a failed refetch until a refetch succeeds', async () => {
      const { episode, unwatched, waitForQueriesIdle, invalidate } =
        await renderSettledMovies();
      const watchedStates = collectDistinctStates(episode.isWatched);
      const knownStates = collectDistinctStates(episode.isWatchedKnown);
      const failed = failMovies();
      await unwatched.add();
      await settleFailure(waitForQueriesIdle, failed);
      const knownAfterFailure = await firstValueFrom(episode.isWatchedKnown);
      server.use(
        http.get(
          WATCHED_MOVIES_URL,
          () => pagedResponse({ body: WatchedMoviesResponseMock }),
        ),
      );

      await invalidate(InvalidateAction.MarkAsWatched('movie'));
      await firstValueFrom(episode.isWatchedKnown.pipe(filter(Boolean)));

      expect(knownAfterFailure).toBe(false);
      expect(watchedStates).toEqual([true]);
      expect(knownStates).toEqual([true, false, true]);
    });
  });

  describe('no targets', () => {
    it('should count no plays', async () => {
      const { plays } = await renderStore(() => useWatched(NO_MOVIES));

      expect(await firstValueFrom(plays)).toBe(0);
    });

    it('should read no pending value', async () => {
      const { pendingWatched } = await renderStore(() => useWatched(NO_MOVIES));

      expect(await firstValueFrom(pendingWatched)).toBeUndefined();
    });

    it('should neither confirm nor write on add or remove', async () => {
      const { add, remove } = await renderStore(() => useWatched(NO_MOVIES));

      const requests = await captureRequests(async () => {
        await add();
        await remove();
      });

      expect(requests.filter((request) => request.startsWith('POST')))
        .toEqual([]);
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  describe('add', () => {
    it('should flip to watched while the request is in flight, then settle', async () => {
      const { add, isWatched, isUpdating } = await renderSettledHistory(() =>
        useWatched(UNWATCHED_MOVIE)
      );
      const inFlight: unknown[] = [];
      server.use(
        http.post(SYNC_HISTORY_URL, async ({ request }) => {
          inFlight.push(
            await request.json(),
            await firstValueFrom(isWatched),
            await firstValueFrom(isUpdating),
          );
          return new HttpResponse(null, { status: 201 });
        }),
      );

      const requests = await captureRequests(() => add());

      expect(inFlight).toEqual([
        {
          movies: [{
            ids: { trakt: UNWATCHED_MOVIE.media.id },
            watched_at: 'now',
          }],
        },
        true,
        true,
      ]);
      expect(requests).toContain('GET /users/me/watched/movies');
      expect(await firstValueFrom(isUpdating)).toBe(false);
    });

    it('should never show the pre-write state again once the write succeeds', async () => {
      const { add, isWatched, plays, waitForLateRequests } = await renderStore(
        () => ({
          ...useWatched(UNWATCHED_MOVIE),
          waitForLateRequests: useWaitForLateRequests(),
        }),
      );
      const hasWritten = { value: false };
      server.use(
        http.post(SYNC_HISTORY_URL, () => {
          hasWritten.value = true;
          return new HttpResponse(null, { status: 201 });
        }),
        http.get(WATCHED_MOVIES_URL, ({ request }) => {
          const page = Number(
            new URL(request.url).searchParams.get('page') ?? 1,
          );
          if (page > 1) return HttpResponse.json({});
          if (!hasWritten.value) {
            return HttpResponse.json(WatchedMoviesResponseMock);
          }

          return HttpResponse.json({
            ...WatchedMoviesResponseMock,
            [UNWATCHED_MOVIE.media.id]: ['2026-10-01T09:00:00.000Z'],
          });
        }),
      );
      const states = collectDistinctStates(isWatched);
      await firstValueFrom(plays);

      await add();
      await firstValueFrom(
        isWatched.pipe(filter((watched) => watched === true)),
      );
      await waitForLateRequests();

      expect(states).toEqual([undefined, false, true]);
    });

    it('should keep an added Target watched while the page it lands on loads, and ignore a second add', async () => {
      server.use(
        http.get(
          WATCHED_MOVIES_URL,
          () => pagedResponse({ body: WatchedMoviesResponseMock }),
        ),
      );
      const { add, isWatched } = await renderSettledHistory(() =>
        useWatched(UNWATCHED_MOVIE)
      );
      const states = collectDistinctStates(isWatched);
      const secondPage = holdResponse(() =>
        pagedResponse({
          body: { [UNWATCHED_MOVIE.media.id]: ['2026-10-01T09:00:00.000Z'] },
          page: 2,
          pageCount: 2,
        })
      );
      serveTwoPages({
        url: WATCHED_MOVIES_URL,
        first: WatchedMoviesResponseMock,
        second: secondPage.answer,
      });

      const adding = add();
      await secondPage.requested;
      const whileLoading = await firstValueFrom(isWatched);
      const secondAdd = await captureRequests(() => add());
      secondPage.release();
      await adding;

      expect(whileLoading).toBe(true);
      expect(secondAdd).toEqual([]);
      expect(states).toEqual([false, true]);
    });

    it('should roll back and show the error toast when the request fails', async () => {
      server.use(
        http.post(
          SYNC_HISTORY_URL,
          () => new HttpResponse(null, { status: 500 }),
        ),
      );
      const { add, isWatched, isUpdating } = await renderSettledHistory(() =>
        useWatched(UNWATCHED_MOVIE)
      );

      await add();

      expect(await firstValueFrom(isWatched)).toBe(false);
      expect(await firstValueFrom(isUpdating)).toBe(false);
      expect(
        within(screen.getByRole('status')).getByText(
          "Couldn't save. Try again.",
        ),
      ).toBeVisible();
    });

    it('should confirm a partly watched show with all its aired episodes', async () => {
      server.use(
        http.get(
          SILO_PROGRESS_URL,
          () =>
            HttpResponse.json({
              ...ShowSiloProgressResponseMock,
              aired: 20,
              completed: 15,
            }),
        ),
      );
      const bodies: unknown[] = [];
      server.use(
        http.post(SYNC_HISTORY_URL, async ({ request }) => {
          bodies.push(await request.json());
          return new HttpResponse(null, { status: 201 });
        }),
      );
      const { add } = await renderSettledHistory(() => useWatched(SILO));

      const added = add();
      await screen.findByText(
        'Mark all 20 aired episodes of "Silo" as watched? Episodes already watched get another play.',
      );
      await answerDialog('Mark as watched?', 'Mark as Watched');
      await added;

      expect(bodies).toStrictEqual([
        { shows: [{ ids: { trakt: 180770 }, watched_at: 'now' }] },
      ]);
    });

    it('should confirm a fully watched show with all its aired episodes', async () => {
      server.use(
        http.get(
          SILO_PROGRESS_URL,
          () =>
            HttpResponse.json({
              ...ShowSiloProgressResponseMock,
              aired: 20,
              completed: 20,
            }),
        ),
      );
      const { add } = await renderSettledHistory(() => useWatched(SILO));

      const added = add();
      await screen.findByText(
        'Mark all 20 aired episodes of "Silo" as watched? Episodes already watched get another play.',
      );
      await answerDialog('Mark as watched?', 'Cancel');
      await added;
    });

    it('should read the show progress afresh on every add', async () => {
      const progress = { aired: 20 };
      server.use(
        http.get(
          SILO_PROGRESS_URL,
          () =>
            HttpResponse.json({
              ...ShowSiloProgressResponseMock,
              aired: progress.aired,
              completed: 15,
            }),
        ),
      );
      const { add } = await renderSettledHistory(() => useWatched(SILO));

      const requests = await captureRequests(async () => {
        const firstAdd = add();
        await screen.findByText(
          'Mark all 20 aired episodes of "Silo" as watched? Episodes already watched get another play.',
        );
        await answerDialog('Mark as watched?', 'Cancel');
        await firstAdd;

        progress.aired = 21;
        const secondAdd = add();
        await screen.findByText(
          'Mark all 21 aired episodes of "Silo" as watched? Episodes already watched get another play.',
        );
        await answerDialog('Mark as watched?', 'Cancel');
        await secondAdd;
      });

      expect(
        requests.filter((request) =>
          request === 'GET /shows/silo/progress/watched'
        ),
      ).toHaveLength(2);
    });

    it('should neither confirm nor write when the show has no aired episodes', async () => {
      server.use(
        http.get(
          SILO_PROGRESS_URL,
          () =>
            HttpResponse.json({
              ...ShowSiloProgressResponseMock,
              aired: 0,
              completed: 0,
            }),
        ),
      );
      const { add } = await renderSettledHistory(() => useWatched(SILO));

      const requests = await captureRequests(() => add());

      expect(requests.filter((request) => request.startsWith('POST')))
        .toEqual([]);
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it.each([
      { name: 'fails', status: 500 },
      { name: 'is unauthorized', status: 401 },
      { name: 'comes back empty', status: 204 },
    ])(
      'should show the error toast and write nothing when the progress read $name',
      async ({ status }) => {
        server.use(
          http.get(
            SILO_PROGRESS_URL,
            () => new HttpResponse(null, { status }),
          ),
        );
        const { add } = await renderSettledHistory(() => useWatched(SILO));

        const requests = await captureRequests(() => add());

        expect(requests).toContain('GET /shows/silo/progress/watched');
        expect(requests.filter((request) => request.startsWith('POST')))
          .toEqual([]);
        expect(
          within(screen.getByRole('status')).getByText(
            "Couldn't save. Try again.",
          ),
        ).toBeVisible();
      },
    );
  });

  describe('remove', () => {
    it('should confirm with the plays, remove the target from history and refetch the watched history only', async () => {
      const { remove, isWatched, ratings } = await renderSettledHistory(() => ({
        ...useWatched(HERETIC),
        ratings: useUser().ratings,
      }));
      const ratingsSubscription = ratings.subscribe();
      await readKnown(ratings);
      const inFlight: unknown[] = [];
      server.use(
        http.post(
          SYNC_HISTORY_REMOVE_URL,
          async ({ request }) => {
            inFlight.push(
              await request.json(),
              await firstValueFrom(isWatched),
            );
            return new HttpResponse(null, { status: 200 });
          },
        ),
      );

      const requests = await captureRequests(async () => {
        const removed = remove();
        await screen.findByText(
          'Remove the play of "Heretic" from your history?',
        );
        await answerDialog('Remove from history?', 'Remove from History');
        await removed;
      });
      ratingsSubscription.unsubscribe();

      expect(inFlight).toEqual([
        { movies: [{ ids: { trakt: 916302 } }] },
        false,
      ]);
      expect(requests).toContain('GET /users/me/watched/movies');
      expect(
        requests.filter((request) =>
          request.startsWith('GET /users/me/ratings')
        ),
      ).toEqual([]);
    });

    it('should confirm only the plays the targets have', async () => {
      const { remove } = await renderSettledHistory(() =>
        useWatched({
          type: 'movie',
          media: [
            { id: 916302, title: 'Heretic' },
            UNWATCHED_MOVIE.media,
          ],
        })
      );

      const removed = remove();
      await screen.findByText(
        'Remove the play of "Heretic, Unwatched" from your history?',
      );
      await answerDialog('Remove from history?', 'Cancel');
      await removed;
    });

    it('should neither confirm nor write when the targets have no plays', async () => {
      const { remove } = await renderSettledHistory(() =>
        useWatched(UNWATCHED_MOVIE)
      );

      const requests = await captureRequests(() => remove());

      expect(requests.filter((request) => request.startsWith('POST')))
        .toEqual([]);
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('should send nothing and write no override when the confirmation is cancelled', async () => {
      const { remove, isUpdating } = await renderSettledHistory(() =>
        useWatched(HERETIC)
      );
      const updates: boolean[] = [];
      const subscription = isUpdating.subscribe((value) => updates.push(value));

      const requests = await captureRequests(async () => {
        const removed = remove();
        await answerDialog('Remove from history?', 'Cancel');
        await removed;
      });
      subscription.unsubscribe();

      expect(requests.filter((request) => request.startsWith('POST')))
        .toEqual([]);
      expect(updates).toEqual([false]);
    });
  });

  describe('while the history is not known', () => {
    it.each(
      UNKNOWN_HISTORY.flatMap(({ name, reach }) =>
        (['add', 'remove'] as const).map((action) => ({ name, reach, action }))
      ),
    )(
      'should send nothing on $action $name',
      async ({ reach, action }) => {
        const episode = await reach();

        const requests = await captureRequests(() => episode[action]());

        expect(requests).toEqual([]);
        expect(screen.queryByRole('dialog')).toBeNull();
      },
    );
  });

  describe('while the history refetches', () => {
    it('should send nothing on an episode add after a show-level add', async () => {
      const { show, episode } = await renderSettledHistory(() => ({
        show: useWatched(SILO),
        episode: useWatched(SILO_EPISODE),
      }));
      const hasWritten = { value: false };
      // Returning nothing hands the request on to the default handler.
      const refetch = holdResponse(() => undefined);
      server.use(
        http.post(SYNC_HISTORY_URL, () => {
          hasWritten.value = true;
          return new HttpResponse(null, { status: 201 });
        }),
        http.get(WATCHED_SHOWS_URL, () => {
          if (!hasWritten.value) return;
          return refetch.answer();
        }),
      );

      const requests = await captureRequests(async () => {
        const added = show.add();
        await answerDialog('Mark as watched?', 'Mark as Watched');
        await refetch.requested;
        const episodeAdded = episode.add();
        refetch.release();
        await Promise.all([added, episodeAdded]);
      });

      expect(requests.filter((request) => request.startsWith('POST')))
        .toEqual(['POST /sync/history']);
    });

    it(
      'should send nothing from a store mounted over the invalidated history until its refetch lands',
      async () => {
        const { writer, reader, history, waitForUnobserved } =
          await renderStore(() => ({
            writer: useWatched(UNWATCHED_MOVIE),
            reader: useWatched(HERETIC),
            history: useUser().history,
            waitForUnobserved: useWaitForUnobserved(),
          }));
        const subscription = history.subscribe();
        await firstValueFrom(
          history.pipe(filter(($history) => $history !== null)),
        );
        const write = holdRequest({
          method: 'post',
          url: SYNC_HISTORY_URL,
          answer: () => new HttpResponse(null, { status: 201 }),
        });

        const added = writer.add();
        await write.requested;
        subscription.unsubscribe();
        await Promise.all([
          waitForUnobserved(WATCHED_MOVIES_QUERIES),
          waitForUnobserved(WATCHED_SHOWS_QUERIES),
        ]);
        write.release();
        await added;
        const refetch = holdRequest({ method: 'get', url: WATCHED_MOVIES_URL });
        const requests = await captureRequests(async () => {
          const whileRefetching = reader.add();
          await refetch.requested;
          refetch.release();
          await whileRefetching;
          await firstValueFrom(
            history.pipe(filter(($history) => $history !== null)),
          );
          await reader.add();
        });

        expect(requests.filter((request) => request.startsWith('POST')))
          .toEqual(['POST /sync/history']);
      },
      10_000,
    );
  });

  describe('while a show-level add reads the episode count', () => {
    it('should show one failed toast when clicked again during a retry', async () => {
      const calls = { count: 0 };
      const fail = () => new HttpResponse(null, { status: 500 });
      const retry = holdResponse(fail);
      server.use(
        http.get(SILO_PROGRESS_URL, () => {
          calls.count += 1;
          if (calls.count === 1) return fail();
          return retry.answer();
        }),
      );
      const { add, isUpdating } = await renderSettledHistory(() =>
        useWatched(SILO)
      );

      const first = add();
      await retry.requested;
      const second = add();
      const whileReading = await firstValueFrom(isUpdating);
      retry.release();
      await Promise.all([first, second]);

      expect(whileReading).toBe(true);
      expect(
        within(screen.getByRole('status')).getAllByText(
          "Couldn't save. Try again.",
        ),
      ).toHaveLength(1);
      expect(await firstValueFrom(isUpdating)).toBe(false);
    });

    it('should confirm once and write once when clicked again while the count loads', async () => {
      const read = holdRequest({
        method: 'get',
        url: SILO_PROGRESS_URL,
        answer: () => HttpResponse.json(ShowSiloProgressResponseMock),
      });
      const { add, isUpdating } = await renderSettledHistory(() =>
        useWatched(SILO)
      );

      const requests = await captureRequests(async () => {
        const first = add();
        await read.requested;
        const second = add();
        read.release();
        const dialogs = await screen.findAllByRole('dialog', {
          name: 'Mark as watched?',
        });
        expect(dialogs).toHaveLength(1);
        await answerDialog('Mark as watched?', 'Mark as Watched');
        await first;
        await second;
      });

      expect(requests.filter((request) => request.startsWith('POST')))
        .toEqual(['POST /sync/history']);
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(await firstValueFrom(isUpdating)).toBe(false);
    });
  });

  describe('while the show progress is observed offline', () => {
    const PROGRESS_KEY = showProgressQuery({ slug: 'silo' }).queryKey;

    // Before the test bed unmounts, while the client still hears the event.
    afterEach(() => {
      setNetwork('online');
    });

    const renderObservedSilo = () =>
      renderSettledHistory(() => ({
        silo: useWatched(SILO),
        ...useObserverApart(showProgressQuery({ slug: 'silo' })),
      }));

    function expectFailedToast() {
      expect(
        within(screen.getByRole('status')).getByText(
          "Couldn't save. Try again.",
        ),
      ).toBeVisible();
    }

    it('should fail at once while the observed read is paused', async () => {
      server.use(http.get(SILO_PROGRESS_URL, () => HttpResponse.error()));
      const { silo, observe, waitForQueryPaused } = await renderObservedSilo();
      setNetwork('offline');
      observe();
      await waitForQueryPaused({ queryKey: PROGRESS_KEY });

      expect(await settleWithin(silo.add(), 1000)).toBe('resolved');
      expectFailedToast();
    });

    it('should fail at once while the observed read is in flight', async () => {
      const calls = { count: 0 };
      const observed = holdResponse(() => HttpResponse.error());
      server.use(
        http.get(SILO_PROGRESS_URL, () => {
          calls.count += 1;
          if (calls.count === 1) return observed.answer();
          return HttpResponse.error();
        }),
      );
      const { silo, observe } = await renderObservedSilo();
      observe();
      await observed.requested;
      setNetwork('offline');

      const added = silo.add();
      observed.release();

      expect(await settleWithin(added, 1000)).toBe('resolved');
      expectFailedToast();
    });

    it('should leave the observed read to wait for reconnect after a count read', async () => {
      const {
        silo,
        observe,
        invalidate,
        waitForQueriesIdle,
        waitForQueryPaused,
      } = await renderObservedSilo();
      observe();
      await waitForQueriesIdle({ queryKey: PROGRESS_KEY });
      const added = silo.add();
      await answerDialog('Mark as watched?', 'Cancel');
      await added;
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

  describe('pending value', () => {
    it("should read an add's value while it writes, and nothing while it counts a show's episodes", async () => {
      const read = holdRequest({
        method: 'get',
        url: SILO_PROGRESS_URL,
        answer: () => HttpResponse.json(ShowSiloProgressResponseMock),
      });
      const write = holdRequest({
        method: 'post',
        url: SYNC_HISTORY_URL,
        answer: () => new HttpResponse(null, { status: 201 }),
      });
      const { add, isUpdating, pendingWatched } = await renderSettledHistory(
        () => useWatched(SILO),
      );

      const added = add();
      await read.requested;
      const whileCounting = [
        await firstValueFrom(isUpdating),
        await firstValueFrom(pendingWatched),
      ];
      read.release();
      await answerDialog('Mark as watched?', 'Mark as Watched');
      await write.requested;
      const whileWriting = await firstValueFrom(pendingWatched);
      write.release();
      await added;

      expect(whileCounting).toEqual([true, undefined]);
      expect(whileWriting).toBe(true);
      expect(await firstValueFrom(pendingWatched)).toBeUndefined();
    });

    it("should read a remove's value while it writes", async () => {
      const write = holdRequest({
        method: 'post',
        url: SYNC_HISTORY_REMOVE_URL,
        answer: () => new HttpResponse(null, { status: 200 }),
      });
      const { remove, pendingWatched } = await renderSettledHistory(() =>
        useWatched(HERETIC)
      );

      const removed = remove();
      await answerDialog('Remove from history?', 'Remove from History');
      await write.requested;
      const whileWriting = await firstValueFrom(pendingWatched);
      write.release();
      await removed;

      expect(whileWriting).toBe(false);
      expect(await firstValueFrom(pendingWatched)).toBeUndefined();
    });
  });

  describe('while a show-level add confirms', () => {
    it('should read not updating before the confirmation is answered', async () => {
      const { add, isUpdating } = await renderSettledHistory(() =>
        useWatched(SILO)
      );

      const added = add();
      await screen.findByRole('dialog', { name: 'Mark as watched?' });
      const whileConfirming = await firstValueFrom(isUpdating);
      await answerDialog('Mark as watched?', 'Cancel');
      await added;

      expect(whileConfirming).toBe(false);
    });

    // The confirmation context refuses a second dialog while one is open.
    it('should write once when added again while its confirmation is open', async () => {
      const { add } = await renderSettledHistory(() => useWatched(SILO));

      const requests = await captureRequests(async () => {
        const first = add();
        await screen.findByRole('dialog', { name: 'Mark as watched?' });
        await add();
        await answerDialog('Mark as watched?', 'Mark as Watched');
        await first;
      });

      expect(requests.filter((request) => request.startsWith('POST')))
        .toEqual(['POST /sync/history']);
    });
  });

  describe('while a write is pending', () => {
    it('should ignore add and remove until the override clears', async () => {
      const { add, remove } = await renderSettledHistory(() =>
        useWatched(HERETIC)
      );
      const write = holdRequest({
        method: 'post',
        url: SYNC_HISTORY_URL,
        answer: () => new HttpResponse(null, { status: 201 }),
      });

      const requests = await captureRequests(async () => {
        const added = add();
        await write.requested;
        const ignored = Promise.all([add(), remove()]);
        write.release();
        await added;
        await ignored;
      });

      expect(requests.filter((request) => request.startsWith('POST')))
        .toEqual(['POST /sync/history']);
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('should drop an add whose target started a write while it confirmed', async () => {
      const { first, second } = await renderSettledHistory(() => ({
        first: useWatched(SILO),
        second: useWatched(SILO),
      }));
      const read = holdRequest({
        method: 'get',
        url: SILO_PROGRESS_URL,
        answer: () => HttpResponse.json(ShowSiloProgressResponseMock),
      });
      const write = holdRequest({
        method: 'post',
        url: SYNC_HISTORY_REMOVE_URL,
        answer: () => new HttpResponse(null, { status: 200 }),
      });

      const requests = await captureRequests(async () => {
        const added = first.add();
        const removed = second.remove();
        await answerDialog('Remove from history?', 'Remove from History');
        await write.requested;
        read.release();
        await answerDialog('Mark as watched?', 'Mark as Watched');
        write.release();
        await Promise.all([added, removed]);
      });

      expect(requests.filter((request) => request.startsWith('POST')))
        .toEqual(['POST /sync/history/remove']);
    });

    it('should drop a remove whose target started a write while it confirmed', async () => {
      const { first, second } = await renderSettledHistory(() => ({
        first: useWatched(HERETIC),
        second: useWatched(HERETIC),
      }));
      const write = holdRequest({
        method: 'post',
        url: SYNC_HISTORY_URL,
        answer: () => new HttpResponse(null, { status: 201 }),
      });

      const requests = await captureRequests(async () => {
        const removed = first.remove();
        await screen.findByRole('dialog', { name: 'Remove from history?' });
        const added = second.add();
        await write.requested;
        await answerDialog('Remove from history?', 'Remove from History');
        write.release();
        await Promise.all([removed, added]);
      });

      expect(requests.filter((request) => request.startsWith('POST')))
        .toEqual(['POST /sync/history']);
    });
  });

  describe('once a remove is confirmed', () => {
    it('should send nothing and show the refusal toast when a write added a play while it confirmed', async () => {
      const { first, second } = await renderSettledHistory(() => ({
        first: useWatched(HERETIC),
        second: useWatched(HERETIC),
      }));
      const hasWritten = { value: false };
      server.use(
        http.post(SYNC_HISTORY_URL, () => {
          hasWritten.value = true;
          return new HttpResponse(null, { status: 201 });
        }),
        http.get(WATCHED_MOVIES_URL, ({ request }) => {
          const page = Number(
            new URL(request.url).searchParams.get('page') ?? 1,
          );
          if (page > 1) return HttpResponse.json({});
          if (!hasWritten.value) {
            return HttpResponse.json(WatchedMoviesResponseMock);
          }

          return HttpResponse.json({
            916302: ['2024-12-27T16:15:28.000Z', '2026-10-03T09:00:00.000Z'],
          });
        }),
      );

      const playsBeforeConfirm: number[] = [];
      const requests = await captureRequests(async () => {
        const removed = first.remove();
        await screen.findByText(
          'Remove the play of "Heretic" from your history?',
        );
        await second.add();
        playsBeforeConfirm.push(await firstValueFrom(first.plays));
        await answerDialog('Remove from history?', 'Remove from History');
        await removed;
      });

      expect(playsBeforeConfirm).toEqual([2]);
      expect(requests.filter((request) => request.startsWith('POST')))
        .toEqual(['POST /sync/history']);
      expect(
        within(screen.getByRole('status')).getByText(REFUSED_TOAST),
      ).toBeVisible();
    });

    it('should send nothing and show the refusal toast while an episode add of the show is in flight', async () => {
      const { show, episode } = await renderSettledHistory(() => ({
        show: useWatched(SILO),
        episode: useWatched(SILO_EPISODE),
      }));
      const write = holdRequest({
        method: 'post',
        url: SYNC_HISTORY_URL,
        answer: () => new HttpResponse(null, { status: 201 }),
      });

      const requests = await captureRequests(async () => {
        const added = episode.add();
        await write.requested;
        const removed = show.remove();
        await answerDialog('Remove from history?', 'Remove from History');
        // Holds the episode add until the remove has refused or started its write.
        await Promise.race([
          removed,
          firstValueFrom(show.isUpdating.pipe(filter(Boolean))),
        ]);
        write.release();
        await Promise.all([added, removed]);
      });

      expect(requests.filter((request) => request.startsWith('POST')))
        .toEqual(['POST /sync/history']);
      expect(
        within(screen.getByRole('status')).getByText(REFUSED_TOAST),
      ).toBeVisible();
    });

    it('should send nothing and show the refusal toast when the history is not known', async () => {
      const { episode, unwatched, waitForQueriesIdle } =
        await renderSettledMovies();

      const requests = await captureRequests(async () => {
        const removed = episode.remove();
        await screen.findByText(
          'Remove the play of "Silo 1x01" from your history?',
        );
        const failed = failMovies();
        await unwatched.add();
        await settleFailure(waitForQueriesIdle, failed);
        await answerDialog('Remove from history?', 'Remove from History');
        await removed;
      });

      expect(requests.filter((request) => request.startsWith('POST')))
        .toEqual(['POST /sync/history']);
      expect(
        within(screen.getByRole('status')).getByText(REFUSED_TOAST),
      ).toBeVisible();
    });
  });

  describe('for a season', () => {
    it('should take a season with its aired count and its titled show, and no title of its own', () => {
      expectTypeOf<{
        type: 'season';
        media: {
          id: number;
          number: number;
          episodes: { count: number; aired: number };
        };
        show: { id: number; title: string };
      }>().toExtend<WatchedStoreProps>();
      expectTypeOf<{
        type: 'season';
        media: { id: number; number: number };
        show: { id: number; title: string };
      }>().not.toExtend<WatchedStoreProps>();
      expectTypeOf<{
        type: 'season';
        media: {
          id: number;
          number: number;
          episodes: { count: number; aired: number };
        };
        show: { id: number };
      }>().not.toExtend<WatchedStoreProps>();
    });

    it("should sum its episodes' plays and read their latest play, leaving other seasons out", async () => {
      server.use(
        http.get(
          WATCHED_SHOWS_URL,
          () => pagedResponse({ body: WatchedShowsSiloResponseMock }),
        ),
      );
      const { plays, lastWatchedAt } = await renderStore(() =>
        useWatched(SILO_FIRST_SEASON)
      );

      expect(await firstValueFrom(plays)).toBe(3);
      expect(await firstValueFrom(lastWatchedAt)).toEqual(
        new Date('2025-03-10T20:00:00.000Z'),
      );
    });

    it('should read no plays and no last play for a season never watched', async () => {
      const { plays, lastWatchedAt } = await renderStore(() =>
        useWatched(SILO_SECOND_SEASON)
      );

      expect(await firstValueFrom(plays)).toBe(0);
      expect(await firstValueFrom(lastWatchedAt)).toBeUndefined();
    });

    it.each([
      {
        name: 'every aired episode watched',
        props: DEVS_FIRST_SEASON,
        expected: true,
      },
      {
        name: 'one of ten aired watched',
        props: SILO_FIRST_SEASON,
        expected: false,
      },
    ])(
      'should read a season with $name as watched: $expected',
      async ({ props, expected }) => {
        const { isWatched } = await renderSettledHistory(() =>
          useWatched(props)
        );

        expect(await readKnown(isWatched)).toBe(expected);
      },
    );

    it('should confirm with its aired count, read no progress, post a top-level season and refetch the shows history and the progress', async () => {
      const bodies: unknown[] = [];
      server.use(
        http.post(SYNC_HISTORY_URL, async ({ request }) => {
          bodies.push(await request.json());
          return new HttpResponse(null, { status: 201 });
        }),
      );
      const { season, observe, waitForQueriesIdle } =
        await renderSettledHistory(() => ({
          season: useWatched(SILO_FIRST_SEASON),
          ...useObserverApart(showProgressQuery({ slug: 'silo' })),
        }));
      observe();
      await waitForQueriesIdle();

      const added = { promise: Promise.resolve() };
      const beforeAnswer = await captureRequests(async () => {
        added.promise = season.add();
        await screen.findByText(SILO_FIRST_SEASON_PROMPT);
      });
      const afterAnswer = await captureRequests(async () => {
        await answerDialog('Mark as watched?', 'Mark as Watched');
        await added.promise;
      });

      expect(beforeAnswer).toEqual([]);
      expect(bodies).toStrictEqual([
        { seasons: [{ ids: { trakt: 257490 }, watched_at: 'now' }] },
      ]);
      expect(afterAnswer).toContain('GET /users/me/watched/shows');
      expect(afterAnswer).toContain('GET /shows/silo/progress/watched');
    });

    it('should neither confirm nor write when the season has no aired episodes', async () => {
      const { add } = await renderSettledHistory(() =>
        useWatched({
          ...SILO_FIRST_SEASON,
          media: {
            ...SILO_FIRST_SEASON.media,
            episodes: { count: 10, aired: 0 },
          },
        })
      );

      const requests = await captureRequests(() => add());

      expect(requests.filter((request) => request.startsWith('POST')))
        .toEqual([]);
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('should send nothing when its confirmation is cancelled', async () => {
      const { add } = await renderSettledHistory(() =>
        useWatched(SILO_FIRST_SEASON)
      );

      const requests = await captureRequests(async () => {
        const added = add();
        await answerDialog('Mark as watched?', 'Cancel');
        await added;
      });

      expect(requests.filter((request) => request.startsWith('POST')))
        .toEqual([]);
    });

    it('should write once when added again while its confirmation is open', async () => {
      const { add } = await renderSettledHistory(() =>
        useWatched(SILO_FIRST_SEASON)
      );

      const requests = await captureRequests(async () => {
        const first = add();
        await screen.findByRole('dialog', { name: 'Mark as watched?' });
        await add();
        await answerDialog('Mark as watched?', 'Mark as Watched');
        await first;
      });

      expect(requests.filter((request) => request.startsWith('POST')))
        .toEqual(['POST /sync/history']);
    });

    it('should confirm with its play and remove it as a top-level season', async () => {
      const bodies: unknown[] = [];
      server.use(
        http.post(SYNC_HISTORY_REMOVE_URL, async ({ request }) => {
          bodies.push(await request.json());
          return new HttpResponse(null, { status: 200 });
        }),
      );
      const { remove } = await renderSettledHistory(() =>
        useWatched(SILO_FIRST_SEASON)
      );

      const removed = remove();
      await screen.findByText(
        'Remove the play of "Season 1 of Silo" from your history?',
      );
      await answerDialog('Remove from history?', 'Remove from History');
      await removed;

      expect(bodies).toStrictEqual([{ seasons: [{ ids: { trakt: 257490 } }] }]);
    });

    it('should refetch the shows history and the progress once its removal is confirmed', async () => {
      const { season, observe, waitForQueriesIdle } =
        await renderSettledHistory(() => ({
          season: useWatched(SILO_FIRST_SEASON),
          ...useObserverApart(showProgressQuery({ slug: 'silo' })),
        }));
      observe();
      await waitForQueriesIdle();

      const removed = season.remove();
      await screen.findByRole('dialog', { name: 'Remove from history?' });
      const afterAnswer = await captureRequests(async () => {
        await answerDialog('Remove from history?', 'Remove from History');
        await removed;
      });

      expect(afterAnswer).toContain('POST /sync/history/remove');
      expect(afterAnswer).toContain('GET /users/me/watched/shows');
      expect(afterAnswer).toContain('GET /shows/silo/progress/watched');
    });

    it("should confirm the removal of every play of the season's episodes", async () => {
      const { remove } = await renderSettledHistory(() =>
        useWatched(DEVS_FIRST_SEASON)
      );

      const removed = remove();
      await screen.findByText(
        'Remove all 10 plays of "Season 1 of Devs" from your history?',
      );
      await answerDialog('Remove from history?', 'Cancel');
      await removed;
    });
  });
});
