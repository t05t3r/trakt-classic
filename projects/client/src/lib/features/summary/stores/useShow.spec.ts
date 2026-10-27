import { SILO_PEOPLE_URL } from '$mocks/data/shows/SILO_PEOPLE_URL.ts';
import { DEVS_SUMMARY_URL } from '$mocks/data/shows/DEVS_SUMMARY_URL.ts';
import { OfficialListsMappedMock } from '$mocks/data/lists/mapped/OfficialListsMappedMock.ts';
import { SILO_OFFICIAL_LISTS_URL } from '$mocks/data/shows/SILO_OFFICIAL_LISTS_URL.ts';
import { SILO_PERSONAL_LISTS_URL } from '$mocks/data/shows/SILO_PERSONAL_LISTS_URL.ts';
import { SiloListsMappedMock } from '$mocks/data/summary/shows/silo/mapped/SiloListsMappedMock.ts';
import { SiloListsResponseMock } from '$mocks/data/summary/shows/silo/response/SiloListsResponseMock.ts';
import { SILO_PROGRESS_URL } from '$mocks/data/shows/SILO_PROGRESS_URL.ts';
import { SILO_RELATED_URL } from '$mocks/data/shows/SILO_RELATED_URL.ts';
import { ShowDevsMappedMock } from '$mocks/data/summary/shows/devs/ShowDevsMappedMock.ts';
import { ShowSiloRelatedMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloRelatedMappedMock.ts';
import { ShowSiloResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloResponseMock.ts';
import { valueObservable } from '$test/beds/store/valueObservable.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { ShowSiloRatingsMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloRatingsMappedMock.ts';
import { ShowSiloPeopleMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloPeopleMappedMock.ts';
import { ShowSiloPeopleResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloPeopleResponseMock.ts';
import { ShowSiloProgressMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloProgressMappedMock.ts';
import { ShowSiloSeasonsMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloSeasonsMappedMock.ts';
import { ShowSiloStatsMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloStatsMappedMock.ts';
import { ShowSiloStudiosMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloStudiosMappedMock.ts';
import { ShowSiloProgressResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloProgressResponseMock.ts';
import { ShowSiloSpecialsResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloSpecialsResponseMock.ts';
import { ShowSiloSeasonsResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloSeasonsResponseMock.ts';
import { ShowSiloSeasonsWithSpecialsResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloSeasonsWithSpecialsResponseMock.ts';
import { ShowSiloSeasonFourResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloSeasonFourResponseMock.ts';
import { SILO_SEASONS_URL } from '$mocks/data/shows/SILO_SEASONS_URL.ts';
import { SILO_STATS_URL } from '$mocks/data/shows/SILO_STATS_URL.ts';
import { ShowSiloStatsResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloStatsResponseMock.ts';
import { SYNC_HISTORY_URL } from '$mocks/data/sync/SYNC_HISTORY_URL.ts';
import { server } from '$mocks/server.ts';
import {
  useWatched,
  type WatchedStoreProps,
} from '$lib/features/media-actions/stores/useWatched.ts';
import { kindsOf } from '$test/beds/query/kindsOf.ts';
import { nextOf } from '$test/beds/query/nextOf.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { useWaitForQueriesIdle } from '$test/beds/query/useWaitForQueriesIdle.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { notFound } from '$test/beds/request/notFound.ts';
import { readKnown } from '$test/beds/store/readKnown.ts';
import { renderSettledHistory } from '$test/beds/store/renderSettledHistory.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import type { SeasonsResponse, ShowProgressResponse } from '@trakt/api';
import { http, HttpResponse } from 'msw';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { useShow } from './useShow.ts';

function serveStats(answer: () => Response) {
  server.use(http.get(SILO_STATS_URL, answer));
}

function serveSeasons(body: SeasonsResponse) {
  server.use(http.get(SILO_SEASONS_URL, () => HttpResponse.json(body)));
}

function serveProgress(answer: () => Response) {
  server.use(http.get(SILO_PROGRESS_URL, answer));
}

function servePeople(answer: () => Response) {
  server.use(http.get(SILO_PEOPLE_URL, answer));
}

// Trakt answers a show with no plays with its aired count and none completed.
const NO_PLAYS: ShowProgressResponse = {
  ...ShowSiloProgressResponseMock,
  completed: 0,
  last_watched_at: null,
  seasons: ShowSiloProgressResponseMock.seasons.map((season) => ({
    ...season,
    completed: 0,
  })),
};

const ORDER_PLAYED_AT = '2025-01-05T20:00:00.000Z';

// Silo's progress once 2x02, "Order", has a play.
const ORDER_WATCHED: ShowProgressResponse = {
  ...ShowSiloProgressResponseMock,
  completed: 12,
  seasons: ShowSiloProgressResponseMock.seasons.map((season) =>
    season.number === 2
      ? {
        ...season,
        completed: 2,
        episodes: season.episodes.map((episode) =>
          episode.number === 2
            ? { ...episode, completed: true, last_watched_at: ORDER_PLAYED_AT }
            : episode
        ),
      }
      : season
  ),
};

const SILO_ORDER = {
  type: 'episode',
  media: { id: 12105048, title: 'Order', season: 2, number: 2 },
  show: { id: ShowSiloMappedMock.id, title: ShowSiloMappedMock.title },
} satisfies WatchedStoreProps;

const SPECIALS_ONLY: SeasonsResponse = [ShowSiloSpecialsResponseMock];

function renderShow() {
  return renderStore(() => useShow(valueObservable(ShowSiloMappedMock.slug)));
}

describe('store: useShow', () => {
  describe('show: Silo (2023)', () => {
    it('should contain summary', async () => {
      const result = await runQuery({
        factory: () => useShow(valueObservable(ShowSiloMappedMock.slug)).show,
      });

      expect(result).to.deep.equal(ShowSiloMappedMock);
    });

    it('should return crew', async () => {
      const result = await runQuery({
        factory: () => useShow(valueObservable(ShowSiloMappedMock.slug)).crew,
        waitFor: (result) => result.cast.length !== 0,
      });

      expect(result).to.deep.equal(ShowSiloPeopleMappedMock);
    });

    it('should return the progress', async () => {
      const result = await runQuery({
        factory: () =>
          useShow(valueObservable(ShowSiloMappedMock.slug)).progress,
      });

      expect(result).toEqual(ShowSiloProgressMappedMock);
    });

    it("should refetch the progress once an episode is marked watched, so its season's entry counts the play", async () => {
      const written = { value: false };
      server.use(
        http.post(SYNC_HISTORY_URL, () => {
          written.value = true;
          return new HttpResponse(null, { status: 201 });
        }),
      );
      serveProgress(() =>
        HttpResponse.json(
          written.value ? ORDER_WATCHED : ShowSiloProgressResponseMock,
        )
      );
      const { progress, episode, waitForQueriesIdle } =
        await renderSettledHistory(() => ({
          progress: useShow(valueObservable(ShowSiloMappedMock.slug)).progress,
          episode: useWatched(SILO_ORDER),
          waitForQueriesIdle: useWaitForQueriesIdle(),
        }));
      const before = await readKnown(progress);

      await episode.add();
      await waitForQueriesIdle();

      expect(before.seasons.at(1)).toEqual({
        number: 2,
        total: 7,
        completed: 1,
        lastWatchedAt: new Date('2024-12-27T19:40:28.000Z'),
      });
      expect((await readKnown(progress)).seasons.at(1)).toEqual({
        number: 2,
        total: 7,
        completed: 2,
        lastWatchedAt: new Date(ORDER_PLAYED_AT),
      });
    });

    it('should read the progress as loading until it is in', async () => {
      holdRequest({ method: 'get', url: SILO_PROGRESS_URL });
      const { progressStatus } = await renderShow();

      expect(await firstValueFrom(progressStatus)).toEqual({ kind: 'loading' });
    });

    it('should read the progress as ready', async () => {
      const { progressStatus } = await renderShow();

      const ready = await nextOf(progressStatus, 'ready');

      expect(ready.data).toEqual(ShowSiloProgressMappedMock);
    });

    it('should read the progress of a show with no plays as empty', async () => {
      serveProgress(() => HttpResponse.json(NO_PLAYS));
      const { progressStatus } = await renderShow();

      expect(await nextOf(progressStatus, 'empty')).toEqual({ kind: 'empty' });
    });

    it('should read a failed progress read as error', async () => {
      serveProgress(notFound);
      const { progressStatus } = await renderShow();

      const failed = await nextOf(progressStatus, 'error');

      expect(failed.retry).toBeInstanceOf(Function);
    });

    it('should read the seasons as ready', async () => {
      const { seasonsStatus } = await renderShow();

      const ready = await nextOf(seasonsStatus, 'ready');

      expect(ready.data).toEqual(ShowSiloSeasonsMappedMock);
    });

    it('should leave out a season with no episodes yet', async () => {
      serveSeasons([
        ...ShowSiloSeasonsResponseMock,
        ShowSiloSeasonFourResponseMock,
      ]);
      const { seasonsStatus } = await renderShow();

      const ready = await nextOf(seasonsStatus, 'ready');

      expect(ready.data).toEqual(ShowSiloSeasonsMappedMock);
    });

    it('should read no seasons as empty', async () => {
      serveSeasons([]);
      const { seasonsStatus } = await renderShow();

      expect(await nextOf(seasonsStatus, 'empty')).toEqual({ kind: 'empty' });
    });

    it('should read a show with only specials as ready', async () => {
      serveSeasons(SPECIALS_ONLY);
      const { seasonsStatus } = await renderShow();

      const ready = await nextOf(seasonsStatus, 'ready');

      expect(ready.data.map(({ number }) => number)).toEqual([0]);
    });

    it('should count the seasons', async () => {
      const { seasonCount } = await renderShow();

      expect(await readKnown(seasonCount)).toBe(3);
    });

    it('should leave the specials out of the count', async () => {
      serveSeasons(ShowSiloSeasonsWithSpecialsResponseMock);
      const { seasonCount } = await renderShow();

      expect(await readKnown(seasonCount)).toBe(3);
    });

    it('should leave a season with no episodes yet out of the count', async () => {
      serveSeasons([
        ...ShowSiloSeasonsResponseMock,
        ShowSiloSeasonFourResponseMock,
      ]);
      const { seasonCount } = await renderShow();

      expect(await readKnown(seasonCount)).toBe(3);
    });

    it('should count a show with only specials as no seasons', async () => {
      serveSeasons(SPECIALS_ONLY);
      const { seasonCount } = await renderShow();

      expect(await readKnown(seasonCount)).toBe(0);
    });

    it('should not count the seasons while they load', async () => {
      holdRequest({ method: 'get', url: SILO_SEASONS_URL });
      const { seasonCount } = await renderShow();

      expect(await firstValueFrom(seasonCount)).toBeUndefined();
    });

    it('should return studios', async () => {
      const result = await runQuery({
        factory: () =>
          useShow(valueObservable(ShowSiloMappedMock.slug)).studios,
        waitFor: (result) => result.length !== 0,
      });

      expect(result).to.deep.equal(ShowSiloStudiosMappedMock);
    });

    it('should return its stats', async () => {
      const result = await runQuery({
        factory: () => useShow(valueObservable(ShowSiloMappedMock.slug)).stats,
      });

      expect(result).to.deep.equal(ShowSiloStatsMappedMock);
    });

    it('should return its ratings', async () => {
      const result = await runQuery({
        factory: () =>
          useShow(valueObservable(ShowSiloMappedMock.slug)).ratings,
      });

      expect(result).to.deep.equal(ShowSiloRatingsMappedMock);
    });

    it('should read its earliest release date as its first air date', async () => {
      const { earliestReleaseDate } = await renderStore(() =>
        useShow(valueObservable(ShowSiloMappedMock.slug))
      );

      expect(await readKnown(earliestReleaseDate))
        .toEqual(ShowSiloMappedMock.effectiveReleaseDate);
    });

    it('should read the comments as error when the stats fail, then ready once a retry lands', async () => {
      serveStats(notFound);
      const { status } = await renderStore(() => ({
        status: useShow(valueObservable(ShowSiloMappedMock.slug))
          .commentsStatus,
      }));
      const kinds = kindsOf(status);
      const failed = await nextOf(status, 'error');

      serveStats(() => HttpResponse.json(ShowSiloStatsResponseMock));
      failed.retry();
      const ready = await nextOf(status, 'ready');

      expect(ready.data).toBe(ShowSiloStatsMappedMock.comments);
      expect(kinds).toEqual(['loading', 'error', 'loading', 'ready']);
    });
  });
  describe('cast', () => {
    function renderCastStatus() {
      return renderStore(() => ({
        status: useShow(valueObservable(ShowSiloMappedMock.slug)).castStatus,
      }));
    }

    it('should read the regulars and the guest stars as ready', async () => {
      const { status } = await renderCastStatus();

      const ready = await nextOf(status, 'ready');

      expect(ready.data).toEqual([
        { key: 'regulars', members: ShowSiloPeopleMappedMock.cast },
        { key: 'guest', members: ShowSiloPeopleMappedMock.guestStars },
      ]);
    });

    it('should keep the guest stars group when there are none', async () => {
      servePeople(() =>
        HttpResponse.json({ ...ShowSiloPeopleResponseMock, guest_stars: null })
      );
      const { status } = await renderCastStatus();

      const ready = await nextOf(status, 'ready');

      expect(ready.data).toEqual([
        { key: 'regulars', members: ShowSiloPeopleMappedMock.cast },
        { key: 'guest', members: [] },
      ]);
    });

    it('should keep the regulars group when there are none', async () => {
      servePeople(() =>
        HttpResponse.json({ ...ShowSiloPeopleResponseMock, cast: [] })
      );
      const { status } = await renderCastStatus();

      const ready = await nextOf(status, 'ready');

      expect(ready.data).toEqual([
        { key: 'regulars', members: [] },
        { key: 'guest', members: ShowSiloPeopleMappedMock.guestStars },
      ]);
    });

    it('should read no regulars and no guest stars as empty', async () => {
      servePeople(() => HttpResponse.json({ cast: [], crew: {} }));
      const { status } = await renderCastStatus();

      expect(await nextOf(status, 'empty')).toEqual({ kind: 'empty' });
    });

    it('should read a failed people read as error', async () => {
      servePeople(notFound);
      const { status } = await renderCastStatus();

      const failed = await nextOf(status, 'error');

      expect(failed.retry).toBeInstanceOf(Function);
    });
  });
  describe('related', () => {
    function renderRelatedStatus(
      slug$ = valueObservable(ShowSiloMappedMock.slug),
    ) {
      return renderStore(() => ({ status: useShow(slug$).relatedStatus }));
    }

    it('should read the related shows as cards', async () => {
      const { status } = await renderRelatedStatus();

      const ready = await nextOf(status, 'ready');

      expect(ready.data).toEqual(
        ShowSiloRelatedMappedMock.map((show) => ({ type: 'show', show })),
      );
    });

    it('should read the related shows as empty when there are none', async () => {
      server.use(http.get(SILO_RELATED_URL, () => HttpResponse.json([])));
      const { status } = await renderRelatedStatus();

      expect(await nextOf(status, 'empty')).toEqual({ kind: 'empty' });
    });

    it("should read the new title's related shows once the slug changes", async () => {
      server.use(
        http.get(
          `${DEVS_SUMMARY_URL}/related`,
          () => HttpResponse.json([ShowSiloResponseMock]),
        ),
      );
      const slug$ = new BehaviorSubject(ShowSiloMappedMock.slug);
      const { status } = await renderRelatedStatus(slug$);
      const kinds = kindsOf(status);
      await nextOf(status, 'ready');

      slug$.next(ShowDevsMappedMock.slug);
      const ready = await nextOf(status, 'ready');

      expect(ready.data).toEqual([{ type: 'show', show: ShowSiloMappedMock }]);
      expect(kinds).toEqual(['loading', 'ready', 'loading', 'ready']);
    });
  });

  describe('lists', () => {
    function renderListsStatus() {
      return renderStore(() => ({
        status: useShow(valueObservable(ShowSiloMappedMock.slug))
          .listsStatus,
      }));
    }

    it('should read the official lists, then the personal ones', async () => {
      const { status } = await renderListsStatus();

      const ready = await nextOf(status, 'ready');

      expect(ready.data).toEqual([
        ...OfficialListsMappedMock,
        ...SiloListsMappedMock,
      ]);
    });

    it('should read the lists as empty when neither read has any', async () => {
      server.use(
        http.get(SILO_OFFICIAL_LISTS_URL, () => HttpResponse.json([])),
        http.get(SILO_PERSONAL_LISTS_URL, () => HttpResponse.json([])),
      );
      const { status } = await renderListsStatus();

      expect(await nextOf(status, 'empty')).toEqual({ kind: 'empty' });
    });

    it('should read the lists as error when the personal lists fail, then ready once a retry lands', async () => {
      server.use(http.get(SILO_PERSONAL_LISTS_URL, notFound));
      const { status } = await renderListsStatus();
      const kinds = kindsOf(status);
      const failed = await nextOf(status, 'error');

      server.use(
        http.get(
          SILO_PERSONAL_LISTS_URL,
          () => HttpResponse.json(SiloListsResponseMock),
        ),
      );
      failed.retry();
      const ready = await nextOf(status, 'ready');

      expect(ready.data).toEqual([
        ...OfficialListsMappedMock,
        ...SiloListsMappedMock,
      ]);
      expect(kinds).toEqual(['loading', 'error', 'loading', 'ready']);
    });
  });
});
