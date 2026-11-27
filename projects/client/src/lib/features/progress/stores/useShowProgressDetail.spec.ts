import type { SeasonRef } from '$lib/requests/models/ShowProgressDetail.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { SILO_HIDDEN_SEASON } from '$mocks/data/media-actions/SILO_HIDDEN_SEASON.ts';
import { UNPLAYED_SILO_SEASON } from '$mocks/data/media-actions/UNPLAYED_SILO_SEASON.ts';
import { SILO_PROGRESS_URL } from '$mocks/data/shows/SILO_PROGRESS_URL.ts';
import { SILO_SEASON_TWO_EPISODES_URL } from '$mocks/data/shows/SILO_SEASON_TWO_EPISODES_URL.ts';
import { SILO_SEASONS_URL } from '$mocks/data/shows/SILO_SEASONS_URL.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { ShowSiloProgressHiddenSeasonTwoMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloProgressHiddenSeasonTwoMappedMock.ts';
import { ShowSiloProgressMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloProgressMappedMock.ts';
import { ShowSiloProgressResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloProgressResponseMock.ts';
import { ShowSiloSeasonTwoEpisodesMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloSeasonTwoEpisodesMappedMock.ts';
import { ShowSiloSeasonsResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloSeasonsResponseMock.ts';
import { ShowSiloSeasonTwoEpisodesResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloSeasonTwoEpisodesResponseMock.ts';
import { server } from '$mocks/server.ts';
import { serveSiloHidingSeasonTwo } from '$test/beds/progress/serveSiloHidingSeasonTwo.ts';
import { serveSiloProgress } from '$test/beds/progress/serveSiloProgress.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { nextOf } from '$test/beds/query/nextOf.ts';
import { useWaitForQueriesIdle } from '$test/beds/query/useWaitForQueriesIdle.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { captureRequests } from '$test/beds/request/captureRequests.ts';
import { failOnce } from '$test/beds/request/failOnce.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { notFound } from '$test/beds/request/notFound.ts';
import { collectDistinctStates } from '$test/beds/store/collectDistinctStates.ts';
import { readSettled } from '$test/beds/store/readSettled.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { valueObservable } from '$test/beds/store/valueObservable.ts';
import { ShowSiloProgressHiddenSeasonTwoResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloProgressHiddenSeasonTwoResponseMock.ts';
import { useInvalidator } from '$lib/features/query/useInvalidator.ts';
import {
  InvalidateAction,
  type InvalidateActionOptions,
} from '$lib/requests/models/InvalidateAction.ts';
import { HIDE_PROGRESS_URL } from '$mocks/data/users/HIDE_PROGRESS_URL.ts';
import { useWaitForLateRequests } from '$test/beds/query/useWaitForLateRequests.ts';
import { servePaged } from '$test/beds/request/servePaged.ts';
import { http, HttpResponse } from 'msw';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { describe, expect, it, vi } from 'vitest';
import { useShowProgressDetail } from './useShowProgressDetail.ts';

const [SEASON_ONE, SEASON_TWO] = ShowSiloProgressMappedMock.seasons;

const silo = () => useShowProgressDetail(valueObservable(ShowSiloMappedMock));

const siloOutOfView = () =>
  useShowProgressDetail(valueObservable(ShowSiloMappedMock), {
    enabled: valueObservable(false),
  });

const readSiloSettled = () => readSettled(() => silo().seasons);

const siloEpisodes = () => silo().episodes(valueObservable(SEASON_TWO_SEASON));

const readSeasonTwoSettled = () => readSettled(() => siloEpisodes());

const SEASON_TWO_SEASON = assertDefined(SEASON_TWO);

const SEASON_TWO_PROGRESS = SEASON_TWO_SEASON.episodes;

describe('store: useShowProgressDetail', () => {
  it("should list each season's progress with its season Target", async () => {
    const status = await readSiloSettled();

    expect(status).toEqual({
      kind: 'ready',
      data: [
        {
          progress: SEASON_ONE,
          target: {
            type: 'season',
            id: 257490,
            title: 'Season 1 of Silo',
            number: 1,
            episodes: { count: 10, aired: 10 },
            airDate: new Date('2023-05-05T01:00:00.000Z'),
            show: { id: 180770, title: 'Silo', slug: 'silo' },
          },
        },
        { progress: SEASON_TWO, target: UNPLAYED_SILO_SEASON },
      ],
    });
  });

  it('should list the seasons with no Target while the seasons load', async () => {
    holdRequest({ method: 'get', url: SILO_SEASONS_URL });
    const { seasons } = await renderStore(silo);

    const ready = await nextOf(seasons, 'ready');

    expect(ready.data).toEqual([
      { progress: SEASON_ONE, target: undefined },
      { progress: SEASON_TWO, target: undefined },
    ]);
  });

  it('should read as an error when the seasons fail, then retry them', async () => {
    failOnce(SILO_SEASONS_URL);
    const { seasons, waitForQueriesIdle } = await renderStore(() => ({
      seasons: silo().seasons,
      waitForQueriesIdle: useWaitForQueriesIdle(),
    }));
    const reads = collectDistinctStates(seasons);

    const failed = await nextOf(seasons, 'error');
    failed.retry();
    await waitForQueriesIdle();

    expect(reads.at(-1)).toMatchObject({
      kind: 'ready',
      data: [{ target: { number: 1 } }, { target: { number: 2 } }],
    });
  });

  it('should give no Target to a season the seasons do not list', async () => {
    server.use(
      http.get(SILO_SEASONS_URL, () =>
        HttpResponse.json(
          ShowSiloSeasonsResponseMock.filter(({ number }) => number === 1),
        )),
    );

    const status = await readSiloSettled();

    expect(status).toMatchObject({
      kind: 'ready',
      data: [
        { progress: SEASON_ONE, target: { id: 257490 } },
        { progress: SEASON_TWO, target: undefined },
      ],
    });
  });

  it('should list the seasons with no Target when the seasons answer no body', async () => {
    server.use(
      http.get(SILO_SEASONS_URL, () => new HttpResponse(null, { status: 204 })),
    );

    const status = await readSiloSettled();

    expect(status).toEqual({
      kind: 'ready',
      data: [
        { progress: SEASON_ONE, target: undefined },
        { progress: SEASON_TWO, target: undefined },
      ],
    });
  });

  it('should read as empty when the progress lists no season', async () => {
    serveSiloProgress({ ...ShowSiloProgressResponseMock, seasons: [] });

    const status = await readSiloSettled();

    expect(status).toEqual({ kind: 'empty' });
  });

  it('should read as listing none, not as empty, when every season is hidden', async () => {
    serveSiloProgress({
      ...ShowSiloProgressHiddenSeasonTwoResponseMock,
      seasons: [],
    });

    const status = await readSettled(() => silo().seasons);

    expect(status).toEqual({ kind: 'ready', data: [] });
  });

  it('should read as an error when the progress fails, then retry it', async () => {
    failOnce(SILO_PROGRESS_URL);
    const { seasons } = await renderStore(silo);

    const failed = await nextOf(seasons, 'error');
    failed.retry();
    const ready = await nextOf(seasons, 'ready');

    expect(ready.data.map(({ progress }) => progress)).toEqual([
      SEASON_ONE,
      SEASON_TWO,
    ]);
  });

  it('should send no request before a subscription', async () => {
    const requests = await captureRequests(async () => {
      await renderStore(() => {
        const detail = silo();
        detail.episodes(valueObservable(SEASON_TWO_SEASON));

        return detail;
      });
      await waitNegativeClaim();
    }, { pathIncludes: '/shows/silo' });

    expect(requests).toEqual([]);
  });

  describe('episodes', () => {
    it('should give each aired episode its watched state and its entry, in order', async () => {
      const squares = await readSeasonTwoSettled();

      expect(squares?.slice(0, 7).map(({ number, state }) => [number, state]))
        .toEqual([
          [1, 'watched'],
          [2, 'next'],
          [3, 'unwatched'],
          [4, 'unwatched'],
          [5, 'unwatched'],
          [6, 'unwatched'],
          [7, 'unwatched'],
        ]);
      expect(squares?.slice(0, 7).map(({ episode }) => episode)).toEqual(
        ShowSiloSeasonTwoEpisodesMappedMock.slice(0, 7),
      );
    });

    it('should add the episodes the season lists past its aired ones as announced', async () => {
      const squares = await readSeasonTwoSettled();

      expect(
        squares?.slice(7).map(({ number, state, episode }) => ({
          number,
          state,
          title: episode?.title,
        })),
      ).toEqual(
        ShowSiloSeasonTwoEpisodesMappedMock.slice(7).map((
          { number, title },
        ) => ({
          number,
          state: 'announced',
          title,
        })),
      );
    });

    it('should take the watched states from the season it is given, not from the read of the shown seasons', async () => {
      serveSiloHidingSeasonTwo();

      const squares = await readSeasonTwoSettled();

      expect(squares?.slice(0, 2).map(({ state }) => state)).toEqual([
        'watched',
        'unwatched',
      ]);
    });

    it('should read only the season it is given', async () => {
      const requests = await captureRequests(
        () => readSeasonTwoSettled(),
        { pathIncludes: '/shows/silo/seasons/' },
      );

      expect(requests).toEqual(['GET /shows/silo/seasons/2']);
    });

    it('should list the aired episodes with no entry while the episodes load', async () => {
      holdRequest({ method: 'get', url: SILO_SEASON_TWO_EPISODES_URL });

      const squares = await runQuery({
        factory: () => siloEpisodes(),
        waitFor: (squares) => squares.length > 0,
      });

      expect(squares.map(({ number, episode }) => [number, episode])).toEqual(
        SEASON_TWO_PROGRESS.map(({ number }) => [number, undefined]),
      );
    });

    it('should list the aired episodes with no entry when the episodes fail', async () => {
      server.use(http.get(SILO_SEASON_TWO_EPISODES_URL, notFound));

      const squares = await readSeasonTwoSettled();

      expect(squares?.map(({ number, episode }) => [number, episode])).toEqual(
        SEASON_TWO_PROGRESS.map(({ number }) => [number, undefined]),
      );
    });

    it('should give no entry to an aired episode the episodes do not list', async () => {
      server.use(
        http.get(SILO_SEASON_TWO_EPISODES_URL, () =>
          HttpResponse.json(
            ShowSiloSeasonTwoEpisodesResponseMock.filter(({ number }) =>
              number === 1
            ),
          )),
      );

      const squares = await readSeasonTwoSettled();

      expect(squares?.map(({ episode }) => episode?.id)).toEqual([
        5165667,
        ...SEASON_TWO_PROGRESS.slice(1).map(() => undefined),
      ]);
    });
  });

  describe('detail', () => {
    it('should send no request while it is not enabled', async () => {
      const requests = await captureRequests(async () => {
        await readSettled(() => siloOutOfView().detail);
      }, { pathIncludes: '/shows/silo' });

      expect(requests).toEqual([]);
    });

    it('should read the progress once it is enabled', async () => {
      const enabled = new BehaviorSubject(false);
      const { detail } = await renderStore(() =>
        useShowProgressDetail(valueObservable(ShowSiloMappedMock), { enabled })
      );
      const reads = collectDistinctStates(detail);

      enabled.next(true);

      await vi.waitFor(() =>
        expect(reads.at(-1)).toEqual(ShowSiloProgressMappedMock)
      );
      expect(reads.at(0)).toBeUndefined();
    });

    const siloWhileHiding = () =>
      useShowProgressDetail(valueObservable(ShowSiloMappedMock), {
        enabled: valueObservable(true),
        onlyWhileHidingSeasons: true,
      });

    it('should read only the cache, while enabled, of a show the hidden seasons list leaves out', async () => {
      const requests = await captureRequests(async () => {
        await readSettled(() => siloWhileHiding().detail);
      }, { pathIncludes: '/shows/silo' });

      expect(requests).toEqual([]);
    });

    it('should read the progress, while enabled, of a show the hidden seasons list names', async () => {
      serveSiloHidingSeasonTwo();

      expect(await readSettled(() => siloWhileHiding().detail))
        .toEqual(ShowSiloProgressHiddenSeasonTwoMappedMock);
    });

    it("should read the progress on a watch only while a hide's refetch of the hidden seasons list names the show", async () => {
      const { detail, invalidate, waitForLateRequests } = await renderStore(
        () => ({
          detail: siloWhileHiding().detail,
          waitForLateRequests: useWaitForLateRequests(),
          ...useInvalidator(),
        }),
      );
      collectDistinctStates(detail);
      const settle = async (action: InvalidateActionOptions) => {
        await invalidate(action);
        await waitForLateRequests();
      };
      const watchRequests = () =>
        captureRequests(
          () => settle(InvalidateAction.MarkAsWatched('episode')),
          { pathIncludes: '/shows/silo' },
        );
      await waitForLateRequests();

      const beforeHide = await watchRequests();
      serveSiloHidingSeasonTwo();
      await settle(InvalidateAction.HideProgress);
      const whileHiding = await watchRequests();
      servePaged({ url: HIDE_PROGRESS_URL, body: [] });
      await settle(InvalidateAction.HideProgress);
      const afterUnhide = await watchRequests();

      expect(beforeHide).toEqual([]);
      expect(whileHiding).toEqual(['GET /shows/silo/progress/watched']);
      expect(afterUnhide).toEqual([]);
    });
  });

  describe('seasonsWithHidden', () => {
    it('should send no request while the hidden seasons are not shown', async () => {
      const requests = await captureRequests(async () => {
        const rows = await readSettled(() =>
          silo().seasonsWithHidden({
            shown: valueObservable(false),
            held: valueObservable([]),
          })
        );
        expect(rows).toEqual({ kind: 'empty' });
      }, { pathIncludes: '/shows/silo' });

      expect(requests).toEqual([]);
    });

    it('should list every season, the hidden ones included, once they are shown', async () => {
      serveSiloHidingSeasonTwo();

      const status = await readSettled(() => {
        const detail = silo();

        return combineLatest([
          detail.seasons,
          detail.seasonsWithHidden({
            shown: valueObservable(true),
            held: valueObservable([]),
          }),
        ]).pipe(map(([, all]) => all));
      });

      expect(status).toEqual({
        kind: 'ready',
        data: [
          {
            progress: SEASON_ONE,
            target: expect.objectContaining({ number: 1 }),
          },
          { progress: SEASON_TWO, target: UNPLAYED_SILO_SEASON },
        ],
      });
    });

    it('should read the shown hidden seasons as an error when the seasons fail', async () => {
      serveSiloHidingSeasonTwo();
      failOnce(SILO_SEASONS_URL);

      const status = await readSettled(() =>
        silo().seasonsWithHidden({
          shown: valueObservable(true),
          held: valueObservable([]),
        })
      );

      expect(status).toEqual({ kind: 'error', retry: expect.any(Function) });
    });

    it('should list only the held seasons, from the cached read, once the hidden ones are no longer shown', async () => {
      serveSiloHidingSeasonTwo();
      const shown = new BehaviorSubject(true);
      const held = new BehaviorSubject<ReadonlyArray<SeasonRef>>([]);
      const { withHidden, waitForQueriesIdle } = await renderStore(() => ({
        withHidden: silo().seasonsWithHidden({ shown, held }),
        waitForQueriesIdle: useWaitForQueriesIdle(),
      }));
      const reads = collectDistinctStates(withHidden);
      await nextOf(withHidden, 'ready');

      const requests = await captureRequests(async () => {
        held.next([SILO_HIDDEN_SEASON]);
        shown.next(false);
        await waitForQueriesIdle();
      }, { pathIncludes: '/shows/silo' });

      expect(requests).toEqual([]);
      expect(reads.at(-1)).toEqual({
        kind: 'ready',
        data: [{ progress: SEASON_TWO, target: UNPLAYED_SILO_SEASON }],
      });
    });
  });

  describe('watchedFlags', () => {
    it('should read no flags while not enabled and the progress is uncached', async () => {
      expect(await readSettled(() => siloOutOfView().watchedFlags))
        .toBeUndefined();
    });

    const readFlagsSettled = () =>
      readSettled(() => {
        const { seasons, watchedFlags } = silo();

        return combineLatest([seasons, watchedFlags]).pipe(
          map(([, flags]) => flags),
        );
      });

    it("should flag every season's episodes in order, with their latest watch, once the progress is read", async () => {
      expect(await readFlagsSettled()).toEqual({
        flags: [
          ...Array.from({ length: 10 }, () => true),
          true,
          ...Array.from({ length: 6 }, () => false),
        ],
        latestWatchAt: new Date('2024-12-27T19:40:28.000Z'),
      });
    });

    it("should give the latest episode watch, not the show's own last watch, when that is older", async () => {
      serveSiloProgress({
        ...ShowSiloProgressResponseMock,
        last_watched_at: '2024-12-20T08:00:00.000Z',
      });

      expect((await readFlagsSettled())?.latestWatchAt).toEqual(
        new Date('2024-12-27T19:40:28.000Z'),
      );
    });

    it('should give no latest watch when no episode has one', async () => {
      serveSiloProgress({
        ...ShowSiloProgressResponseMock,
        seasons: ShowSiloProgressResponseMock.seasons.map((season) => ({
          ...season,
          episodes: season.episodes.map((episode) => ({
            ...episode,
            last_watched_at: null,
          })),
        })),
      });

      expect((await readFlagsSettled())?.latestWatchAt).toBeNull();
    });
  });
});
