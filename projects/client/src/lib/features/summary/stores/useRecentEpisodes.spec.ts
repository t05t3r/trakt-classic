import { showLastEpisodeQuery } from '$lib/requests/queries/shows/showLastEpisodeQuery.ts';
import { showProgressQuery } from '$lib/requests/queries/shows/showProgressQuery.ts';
import { showSeasonEpisodesQuery } from '$lib/requests/queries/shows/showSeasonEpisodesQuery.ts';
import { showSeasonsQuery } from '$lib/requests/queries/shows/showSeasonsQuery.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { SILO_LAST_EPISODE_URL } from '$mocks/data/shows/SILO_LAST_EPISODE_URL.ts';
import { SILO_PROGRESS_URL } from '$mocks/data/shows/SILO_PROGRESS_URL.ts';
import { SILO_SEASON_ONE_EPISODES_URL } from '$mocks/data/shows/SILO_SEASON_ONE_EPISODES_URL.ts';
import { SILO_SEASON_TWO_EPISODES_URL } from '$mocks/data/shows/SILO_SEASON_TWO_EPISODES_URL.ts';
import { SILO_SEASON_THREE_EPISODES_URL } from '$mocks/data/shows/SILO_SEASON_THREE_EPISODES_URL.ts';
import { SILO_SEASONS_URL } from '$mocks/data/shows/SILO_SEASONS_URL.ts';
import type { EpisodeEntry } from '$lib/requests/models/EpisodeEntry.ts';
import { ShowDevsProgressMappedMock } from '$mocks/data/summary/shows/devs/mapped/ShowDevsProgressMappedMock.ts';
import { ShowDevsSeasonEpisodesMappedMock } from '$mocks/data/summary/shows/devs/mapped/ShowDevsSeasonEpisodesMappedMock.ts';
import { ShowDevsProgressResponseMock } from '$mocks/data/summary/shows/devs/response/ShowDevsProgressResponseMock.ts';
import { ShowDevsSeasonEpisodesResponseMock } from '$mocks/data/summary/shows/devs/response/ShowDevsSeasonEpisodesResponseMock.ts';
import { DEVS_SUMMARY_URL } from '$mocks/data/shows/DEVS_SUMMARY_URL.ts';
import { ShowDevsMappedMock } from '$mocks/data/summary/shows/devs/ShowDevsMappedMock.ts';
import { ShowSiloLastEpisodeMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloLastEpisodeMappedMock.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { ShowSiloProgressMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloProgressMappedMock.ts';
import { ShowSiloSeasonEpisodesMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloSeasonEpisodesMappedMock.ts';
import { ShowSiloProgressResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloProgressResponseMock.ts';
import { ShowSiloSeasonsResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloSeasonsResponseMock.ts';
import { ShowSiloSeasonsEmptySeasonTwoResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloSeasonsEmptySeasonTwoResponseMock.ts';
import { server } from '$mocks/server.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { kindsOf } from '$test/beds/query/kindsOf.ts';
import { nextOf } from '$test/beds/query/nextOf.ts';
import { useWaitForLateRequests } from '$test/beds/query/useWaitForLateRequests.ts';
import { useWaitForQueriesIdle } from '$test/beds/query/useWaitForQueriesIdle.ts';
import { captureRequests } from '$test/beds/request/captureRequests.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { notFound } from '$test/beds/request/notFound.ts';
import { collectDistinctStates } from '$test/beds/store/collectDistinctStates.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { serveDevs } from '$test/beds/summary/serveDevs.ts';
import { valueObservable } from '$test/beds/store/valueObservable.ts';
import type { QueryKey } from '@tanstack/query-core';
import type { ShowProgressResponse } from '@trakt/api';
import { http, HttpResponse } from 'msw';
import { BehaviorSubject, map } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { useRecentEpisodes } from './useRecentEpisodes.ts';

const episode = (number: number) =>
  assertDefined(
    ShowSiloSeasonEpisodesMappedMock.find((entry) => entry.number === number),
  );

const SLUG = ShowSiloMappedMock.slug;

const NOTHING_WATCHED = { ...ShowSiloProgressResponseMock, completed: 0 };

const SEASON_TWO_EPISODE = assertDefined(
  ShowSiloProgressResponseMock.next_episode,
);

const SEASON_TWO_ENTRY = assertDefined(ShowSiloProgressMappedMock.nextEpisode);

const SEASON_TWO_PREMIERE = assertDefined(
  ShowSiloProgressResponseMock.last_episode,
);

// Serves Up Next's episode as the last, alone in its season's list, under the episode number given.
function serveLastInSeasonTwo(number = SEASON_TWO_EPISODE.number) {
  const last = { ...SEASON_TWO_EPISODE, number };
  server.use(
    http.get(SILO_LAST_EPISODE_URL, () => HttpResponse.json(last)),
    http.get(SILO_SEASON_TWO_EPISODES_URL, () => HttpResponse.json([last])),
  );
}

function serveNothingWatched() {
  server.use(
    http.get(SILO_PROGRESS_URL, () => HttpResponse.json(NOTHING_WATCHED)),
  );
}

const seasonListsOf = (requests: ReadonlyArray<string>) =>
  requests.filter((request) => /\/seasons\/\d+$/.test(request));

const DEVS_SLUG = ShowDevsMappedMock.slug;

const DEVS_LAST_EPISODE = assertDefined(
  ShowDevsSeasonEpisodesResponseMock.at(-1),
);

const devsEpisode = (number: number) =>
  assertDefined(
    ShowDevsSeasonEpisodesMappedMock.find((entry) => entry.number === number),
  );

// Devs, watched unless given another progress, with Silo's season list.
function serveWatchedDevs(
  progress: ShowProgressResponse = ShowDevsProgressResponseMock,
) {
  serveDevs(ShowSiloSeasonsResponseMock);
  server.use(
    http.get(
      `${DEVS_SUMMARY_URL}/last_episode`,
      () => HttpResponse.json(DEVS_LAST_EPISODE),
    ),
    http.get(
      `${DEVS_SUMMARY_URL}/progress/watched`,
      () => HttpResponse.json(progress),
    ),
  );
}

// Moves Devs's last episode to a second season, so its first season's list is one the block never needs.
function serveDevsLastInSeasonTwo() {
  const last = { ...DEVS_LAST_EPISODE, season: 2 };
  server.use(
    http.get(`${DEVS_SUMMARY_URL}/last_episode`, () => HttpResponse.json(last)),
    http.get(`${DEVS_SUMMARY_URL}/seasons/2`, () => HttpResponse.json([last])),
  );
}

const episodeIdsOf = (episodes: ReadonlyArray<EpisodeEntry>) =>
  episodes.map(({ id }) => id);

const EPISODE_IDS = new Map([
  [SLUG, episodeIdsOf([...ShowSiloSeasonEpisodesMappedMock, SEASON_TWO_ENTRY])],
  [DEVS_SLUG, episodeIdsOf(ShowDevsSeasonEpisodesMappedMock)],
]);

// Every season episode list the block reads until it is ready and no read is left.
async function readSeasonLists() {
  const { status, waitForLateRequests } = await renderStore(() => ({
    status: useRecentEpisodes(valueObservable(SLUG)),
    waitForLateRequests: useWaitForLateRequests(),
  }));
  const requests = await captureRequests(async () => {
    await nextOf(status, 'ready');
    await waitForLateRequests();
  });

  return seasonListsOf(requests);
}

function renderRecentEpisodes() {
  return renderStore(() => useRecentEpisodes(valueObservable(SLUG)));
}

type HeldRead = { url: string; query: { queryKey: QueryKey } };

// The kinds read while one request is held, once every other query is idle, and once it lands.
async function kindsAroundHold({ url, query }: HeldRead) {
  const held = holdRequest({ method: 'get', url });
  const heldId = query.queryKey.at(0);
  const { status, waitForQueriesIdle } = await renderStore(() => ({
    status: useRecentEpisodes(valueObservable(SLUG)),
    waitForQueriesIdle: useWaitForQueriesIdle(),
  }));
  const kinds = kindsOf(status);

  await held.requested;
  await waitNegativeClaim();
  await waitForQueriesIdle({
    predicate: ({ queryKey }) => queryKey.at(0) !== heldId,
  });
  const whileHeld = [...kinds];
  held.release();
  await nextOf(status, 'ready');

  return { whileHeld, landed: kinds };
}

describe('store: useRecentEpisodes', () => {
  it('should read the next episode, the last episode and the one before it', async () => {
    const status = await renderRecentEpisodes();

    const ready = await nextOf(status, 'ready');

    expect(ready.data).toEqual({
      upNext: ShowSiloProgressMappedMock.nextEpisode,
      recentlyAired: [ShowSiloLastEpisodeMappedMock, episode(9)],
    });
  });

  it('should read empty, and no season list, when nothing has aired', async () => {
    server.use(
      http.get(
        SILO_LAST_EPISODE_URL,
        () => new HttpResponse(null, { status: 204 }),
      ),
    );
    const { status, waitForLateRequests } = await renderStore(() => ({
      status: useRecentEpisodes(valueObservable(SLUG)),
      waitForLateRequests: useWaitForLateRequests(),
    }));

    const requests = await captureRequests(async () => {
      expect(await nextOf(status, 'empty')).toEqual({ kind: 'empty' });
      await waitForLateRequests();
    });

    expect(seasonListsOf(requests)).toEqual([]);
  });

  it('should read the error when the last episode fails', async () => {
    server.use(http.get(SILO_LAST_EPISODE_URL, notFound));
    const status = await renderRecentEpisodes();

    const failed = await nextOf(status, 'error');

    expect(failed.retry).toBeInstanceOf(Function);
  });

  it('should leave out Up Next when the progress read fails', async () => {
    server.use(http.get(SILO_PROGRESS_URL, notFound));
    const status = await renderRecentEpisodes();

    const ready = await nextOf(status, 'ready');

    expect(ready.data).toEqual({
      upNext: null,
      recentlyAired: [ShowSiloLastEpisodeMappedMock, episode(9), episode(8)],
    });
  });

  it("should leave out the episode before the last when its season's list fails", async () => {
    server.use(http.get(SILO_SEASON_ONE_EPISODES_URL, notFound));
    const status = await renderRecentEpisodes();

    const ready = await nextOf(status, 'ready');

    expect(ready.data).toEqual({
      upNext: ShowSiloProgressMappedMock.nextEpisode,
      recentlyAired: [ShowSiloLastEpisodeMappedMock],
    });
  });

  it.each([
    {
      read: 'the last episode',
      url: SILO_LAST_EPISODE_URL,
      query: showLastEpisodeQuery({ slug: SLUG }),
    },
    {
      read: 'the progress',
      url: SILO_PROGRESS_URL,
      query: showProgressQuery({ slug: SLUG }),
    },
    {
      read: "the last episode's season",
      url: SILO_SEASON_ONE_EPISODES_URL,
      query: showSeasonEpisodesQuery({ slug: SLUG, season: 1 }),
    },
  ])('should read loading until $read settles', async (held) => {
    const { whileHeld, landed } = await kindsAroundHold(held);

    expect(whileHeld).toEqual(['loading']);
    expect(landed).toEqual(['loading', 'ready']);
  });

  describe('while nothing is watched', () => {
    it("should take the first season's episode 1 for Up Next", async () => {
      serveNothingWatched();
      const status = await renderRecentEpisodes();

      const ready = await nextOf(status, 'ready');

      expect(ready.data).toEqual({
        upNext: episode(1),
        recentlyAired: [ShowSiloLastEpisodeMappedMock, episode(9)],
      });
    });

    it("should read the first season's list once when the last episode aired in it", async () => {
      serveNothingWatched();

      expect(await readSeasonLists()).toEqual([
        'GET /shows/silo/seasons/1',
      ]);
    });

    it("should read the first season's list once, as the previous season's too, when the last episode aired in another", async () => {
      serveNothingWatched();
      serveLastInSeasonTwo();

      expect((await readSeasonLists()).toSorted()).toEqual([
        'GET /shows/silo/seasons/1',
        'GET /shows/silo/seasons/2',
      ]);
    });

    it("should take Up Next from the first season's list when the last episode aired in another", async () => {
      serveNothingWatched();
      serveLastInSeasonTwo();
      const status = await renderRecentEpisodes();

      const ready = await nextOf(status, 'ready');

      expect(ready.data).toEqual({
        upNext: episode(1),
        recentlyAired: [SEASON_TWO_ENTRY, episode(10)],
      });
    });

    it.each([
      {
        read: 'the seasons',
        url: SILO_SEASONS_URL,
        query: showSeasonsQuery({ slug: SLUG }),
      },
      {
        read: "the first season's list",
        url: SILO_SEASON_ONE_EPISODES_URL,
        query: showSeasonEpisodesQuery({ slug: SLUG, season: 1 }),
      },
    ])('should read loading until $read settles', async (held) => {
      serveNothingWatched();
      serveLastInSeasonTwo();

      const { whileHeld, landed } = await kindsAroundHold(held);

      expect(whileHeld).toEqual(['loading']);
      expect(landed).toEqual(['loading', 'ready']);
    });

    it.each([
      { read: 'the seasons', url: SILO_SEASONS_URL },
      { read: "the first season's list", url: SILO_SEASON_ONE_EPISODES_URL },
    ])(
      "should leave out Up Next and the previous season's episodes when $read fails",
      async ({ url }) => {
        serveNothingWatched();
        serveLastInSeasonTwo();
        server.use(http.get(url, notFound));
        const status = await renderRecentEpisodes();

        const ready = await nextOf(status, 'ready');

        expect(ready.data).toEqual({
          upNext: null,
          recentlyAired: [ShowSiloProgressMappedMock.nextEpisode],
        });
      },
    );

    it('should read ready in the same call when the slug returns to it', async () => {
      serveNothingWatched();
      serveWatchedDevs({ ...ShowDevsProgressResponseMock, completed: 0 });
      const slug$ = new BehaviorSubject(SLUG);
      const { status, waitForLateRequests } = await renderStore(() => ({
        status: useRecentEpisodes(slug$),
        waitForLateRequests: useWaitForLateRequests(),
      }));
      const kinds = kindsOf(status);
      await nextOf(status, 'ready');
      await waitForLateRequests();
      slug$.next(DEVS_SLUG);
      await nextOf(status, 'ready');
      await waitForLateRequests();

      slug$.next(SLUG);

      expect(kinds.at(-1)).toBe('ready');
    });
  });

  it("should read only the last episode's season once an episode is watched and the last is its season's third", async () => {
    serveLastInSeasonTwo(3);

    expect(await readSeasonLists()).toEqual(['GET /shows/silo/seasons/2']);
  });

  describe("when the last episode is its season's second", () => {
    it("should fill the row from the previous season's list", async () => {
      serveLastInSeasonTwo();
      const status = await renderRecentEpisodes();

      const ready = await nextOf(status, 'ready');

      expect(ready.data).toEqual({
        upNext: SEASON_TWO_ENTRY,
        recentlyAired: [episode(10), episode(9)],
      });
    });

    it("should place the season's earlier episode before the previous season's", async () => {
      serveLastInSeasonTwo();
      server.use(
        http.get(
          SILO_SEASON_TWO_EPISODES_URL,
          () => HttpResponse.json([SEASON_TWO_PREMIERE, SEASON_TWO_EPISODE]),
        ),
      );
      const status = await renderRecentEpisodes();

      const ready = await nextOf(status, 'ready');

      expect(ready.data).toEqual({
        upNext: SEASON_TWO_ENTRY,
        recentlyAired: [
          expect.objectContaining({
            id: SEASON_TWO_PREMIERE.ids.trakt,
            season: 2,
            number: 1,
          }),
          episode(10),
        ],
      });
    });

    it("should read the previous season's list too", async () => {
      serveLastInSeasonTwo();

      expect((await readSeasonLists()).toSorted()).toEqual([
        'GET /shows/silo/seasons/1',
        'GET /shows/silo/seasons/2',
      ]);
    });

    it('should fill the row past a previous season with no episodes', async () => {
      const last = { ...SEASON_TWO_EPISODE, season: 3 };
      server.use(
        http.get(
          SILO_SEASONS_URL,
          () => HttpResponse.json(ShowSiloSeasonsEmptySeasonTwoResponseMock),
        ),
        http.get(SILO_LAST_EPISODE_URL, () => HttpResponse.json(last)),
        http.get(
          SILO_SEASON_THREE_EPISODES_URL,
          () => HttpResponse.json([last]),
        ),
      );

      expect((await readSeasonLists()).toSorted()).toEqual([
        'GET /shows/silo/seasons/1',
        'GET /shows/silo/seasons/3',
      ]);
    });

    it("should read the previous season's list while the last episode's season loads", async () => {
      serveLastInSeasonTwo();
      holdRequest({ method: 'get', url: SILO_SEASON_TWO_EPISODES_URL });
      const previous = holdRequest({
        method: 'get',
        url: SILO_SEASON_ONE_EPISODES_URL,
      });
      previous.release();
      const status = await renderRecentEpisodes();
      const kinds = kindsOf(status);

      await previous.requested;

      expect(kinds).toEqual(['loading']);
    });

    it.each([
      {
        read: 'the seasons',
        url: SILO_SEASONS_URL,
        query: showSeasonsQuery({ slug: SLUG }),
      },
      {
        read: "the previous season's list",
        url: SILO_SEASON_ONE_EPISODES_URL,
        query: showSeasonEpisodesQuery({ slug: SLUG, season: 1 }),
      },
    ])('should read loading until $read settles', async (held) => {
      serveLastInSeasonTwo();

      const { whileHeld, landed } = await kindsAroundHold(held);

      expect(whileHeld).toEqual(['loading']);
      expect(landed).toEqual(['loading', 'ready']);
    });

    it.each([
      { read: 'the seasons', url: SILO_SEASONS_URL },
      { read: "the previous season's list", url: SILO_SEASON_ONE_EPISODES_URL },
    ])(
      "should leave out the previous season's episodes when $read fails",
      async ({ url }) => {
        serveLastInSeasonTwo();
        server.use(http.get(url, notFound));
        const status = await renderRecentEpisodes();

        const ready = await nextOf(status, 'ready');

        expect(ready.data).toEqual({
          upNext: SEASON_TWO_ENTRY,
          recentlyAired: [],
        });
      },
    );
  });

  it("should read no ready status with the left show's episodes while the new show's last episode loads", async () => {
    serveWatchedDevs();
    const held = holdRequest({
      method: 'get',
      url: `${DEVS_SUMMARY_URL}/last_episode`,
    });
    const heldId = showLastEpisodeQuery({ slug: DEVS_SLUG }).queryKey.at(0);
    const slug$ = new BehaviorSubject(SLUG);
    const { status, waitForQueriesIdle } = await renderStore(() => ({
      status: useRecentEpisodes(slug$),
      waitForQueriesIdle: useWaitForQueriesIdle(),
    }));
    await nextOf(status, 'ready');

    slug$.next(DEVS_SLUG);
    const statuses = collectDistinctStates(status);
    await held.requested;
    await waitForQueriesIdle({
      predicate: ({ queryKey }) => queryKey.at(0) !== heldId,
    });
    held.release();
    await nextOf(status, 'ready');

    const readies = statuses.flatMap((read) =>
      read.kind === 'ready' ? [read.data] : []
    );
    expect(readies).not.toHaveLength(0);
    readies.forEach((data) =>
      expect(data).toEqual({
        upNext: ShowDevsProgressMappedMock.nextEpisode,
        recentlyAired: [devsEpisode(8), devsEpisode(7)],
      })
    );
  });

  it('should read each ready status from the show whose slug it was read for', async () => {
    serveWatchedDevs();
    const slug$ = new BehaviorSubject(SLUG);
    const { status, waitForLateRequests } = await renderStore(() => ({
      status: useRecentEpisodes(slug$),
      waitForLateRequests: useWaitForLateRequests(),
    }));
    const reads = collectDistinctStates(
      status.pipe(map((read) => ({ slug: slug$.value, read }))),
    );
    await nextOf(status, 'ready');
    await waitForLateRequests();
    slug$.next(DEVS_SLUG);
    await nextOf(status, 'ready');
    await waitForLateRequests();

    slug$.next(SLUG);
    await waitForLateRequests();

    const readies = reads.flatMap(({ slug, read }) =>
      read.kind === 'ready' ? [{ slug, data: read.data }] : []
    );
    expect(new Set(readies.map(({ slug }) => slug))).toEqual(
      new Set([SLUG, DEVS_SLUG]),
    );
    readies.forEach(({ slug, data: { upNext, recentlyAired } }) =>
      expect(EPISODE_IDS.get(slug)).toEqual(
        expect.arrayContaining(
          episodeIdsOf([...(upNext ? [upNext] : []), ...recentlyAired]),
        ),
      )
    );
  });

  it('should read no season list when the slug returns to a watched show it has read', async () => {
    serveWatchedDevs();
    serveDevsLastInSeasonTwo();
    serveNothingWatched();
    const slug$ = new BehaviorSubject(DEVS_SLUG);
    const { status, waitForLateRequests } = await renderStore(() => ({
      status: useRecentEpisodes(slug$),
      waitForLateRequests: useWaitForLateRequests(),
    }));
    await nextOf(status, 'ready');
    await waitForLateRequests();
    slug$.next(SLUG);
    await nextOf(status, 'ready');
    await waitForLateRequests();

    const requests = await captureRequests(async () => {
      slug$.next(DEVS_SLUG);
      await waitForLateRequests();
    });

    expect(seasonListsOf(requests)).toEqual([]);
  });

  it('should read ready in the same call when the slug returns to a show it has read', async () => {
    serveWatchedDevs();
    const slug$ = new BehaviorSubject(SLUG);
    const { status, waitForLateRequests } = await renderStore(() => ({
      status: useRecentEpisodes(slug$),
      waitForLateRequests: useWaitForLateRequests(),
    }));
    const kinds = kindsOf(status);
    await nextOf(status, 'ready');
    await waitForLateRequests();
    slug$.next(DEVS_SLUG);
    await nextOf(status, 'ready');
    await waitForLateRequests();

    slug$.next(SLUG);

    expect(kinds.at(-1)).toBe('ready');
  });

  it('should read no list of the show it left once the slug changes', async () => {
    serveWatchedDevs();
    const slug$ = new BehaviorSubject(SLUG);
    const { status, waitForLateRequests } = await renderStore(() => ({
      status: useRecentEpisodes(slug$),
      waitForLateRequests: useWaitForLateRequests(),
    }));
    const kinds = kindsOf(status);
    await nextOf(status, 'ready');
    await waitForLateRequests();

    const requests = await captureRequests(async () => {
      slug$.next(DEVS_SLUG);
      await nextOf(status, 'ready');
      await waitForLateRequests();
      slug$.next(SLUG);
      await waitForLateRequests();
    });
    const back = await nextOf(status, 'ready');

    expect(seasonListsOf(requests)).toEqual(['GET /shows/devs/seasons/1']);
    expect(back.data.recentlyAired).toEqual([
      ShowSiloLastEpisodeMappedMock,
      episode(9),
    ]);
    expect(kinds).toEqual([
      'loading',
      'ready',
      'loading',
      'ready',
      'loading',
      'ready',
    ]);
  });
});
