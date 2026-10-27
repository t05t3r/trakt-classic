import { HERETIC_PEOPLE_URL } from '$mocks/data/movies/HERETIC_PEOPLE_URL.ts';
import { HERETIC_RELATED_URL } from '$mocks/data/movies/HERETIC_RELATED_URL.ts';
import { MovieHereticRelatedMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticRelatedMappedMock.ts';
import { HERETIC_OFFICIAL_LISTS_URL } from '$mocks/data/movies/HERETIC_OFFICIAL_LISTS_URL.ts';
import { HERETIC_PERSONAL_LISTS_URL } from '$mocks/data/movies/HERETIC_PERSONAL_LISTS_URL.ts';
import { HereticListsMappedMock } from '$mocks/data/summary/movies/heretic/mapped/HereticListsMappedMock.ts';
import { HereticListsResponseMock } from '$mocks/data/summary/movies/heretic/response/HereticListsResponseMock.ts';
import { MovieHereticResponseMock } from '$mocks/data/summary/movies/heretic/response/MovieHereticResponseMock.ts';
import { MovieMatrixMappedMock } from '$mocks/data/summary/movies/matrix/MovieMatrixMappedMock.ts';
import { BehaviorSubject } from 'rxjs';
import { OfficialListsMappedMock } from '$mocks/data/lists/mapped/OfficialListsMappedMock.ts';
import { valueObservable } from '$test/beds/store/valueObservable.ts';
import { MovieHereticMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticMappedMock.ts';
import { MovieHereticStatsMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticStatsMappedMock.ts';
import { MovieHereticPeopleMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticPeopleMappedMock.ts';
import { MovieHereticStudiosMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticStudiosMappedMock.ts';
import { MovieHereticReleasesMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticReleasesMappedMock.ts';
import { MovieHereticRatingsMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticRatingsMappedMock.ts';
import { HERETIC_RELEASES_URL } from '$mocks/data/movies/HERETIC_RELEASES_URL.ts';
import { HERETIC_STATS_URL } from '$mocks/data/movies/HERETIC_STATS_URL.ts';
import { MovieHereticStatsResponseMock } from '$mocks/data/summary/movies/heretic/response/MovieHereticStatsResponseMock.ts';
import { server } from '$mocks/server.ts';
import { kindsOf } from '$test/beds/query/kindsOf.ts';
import { nextOf } from '$test/beds/query/nextOf.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { NEGATIVE_CLAIM_WINDOW } from '$test/beds/promise/NEGATIVE_CLAIM_WINDOW.ts';
import { settleWithin } from '$test/beds/promise/settleWithin.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { notFound } from '$test/beds/request/notFound.ts';
import { readKnown } from '$test/beds/store/readKnown.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { useMovie } from './useMovie.ts';

function serveStats(answer: () => Response) {
  server.use(http.get(HERETIC_STATS_URL, answer));
}

function serveReleases(answer: () => Response) {
  server.use(http.get(HERETIC_RELEASES_URL, answer));
}

function renderMovie() {
  return renderStore(() =>
    useMovie(valueObservable(MovieHereticMappedMock.slug))
  );
}

function renderCommentsStatus() {
  return renderStore(() => ({
    status: useMovie(valueObservable(MovieHereticMappedMock.slug))
      .commentsStatus,
  }));
}

describe('store: useMovie', () => {
  describe('movie: Heretic (2024)', () => {
    it('should contain summary', async () => {
      const result = await runQuery({
        factory: () =>
          useMovie(valueObservable(MovieHereticMappedMock.slug)).movie,
      });

      expect(result).to.deep.equal(MovieHereticMappedMock);
    });

    it('should return studios', async () => {
      const result = await runQuery({
        factory: () =>
          useMovie(valueObservable(MovieHereticMappedMock.slug)).studios,
        waitFor: (result) => result.length !== 0,
      });

      expect(result).to.deep.equal(MovieHereticStudiosMappedMock);
    });

    it('should return crew', async () => {
      const result = await runQuery({
        factory: () =>
          useMovie(valueObservable(MovieHereticMappedMock.slug)).crew,
        waitFor: (result) => result.cast.length !== 0,
      });

      expect(result).to.deep.equal(MovieHereticPeopleMappedMock);
    });

    it('should return its most popular official list', async () => {
      const result = await runQuery({
        factory: () =>
          useMovie(valueObservable(MovieHereticMappedMock.slug)).officialList,
        waitFor: (result) => result !== undefined,
      });

      expect(result).to.deep.equal(OfficialListsMappedMock.at(0));
    });

    it('should return its stats', async () => {
      const result = await runQuery({
        factory: () =>
          useMovie(valueObservable(MovieHereticMappedMock.slug)).stats,
      });

      expect(result).to.deep.equal(MovieHereticStatsMappedMock);
    });

    it('should read the stats as not known while they load', async () => {
      holdRequest({
        method: 'get',
        url: HERETIC_STATS_URL,
      });

      const result = await runQuery({
        factory: () =>
          useMovie(valueObservable(MovieHereticMappedMock.slug)).stats,
        waitFor: () => true,
      });

      expect(result).toBeUndefined();
    });

    it('should return its ratings', async () => {
      const result = await runQuery({
        factory: () =>
          useMovie(valueObservable(MovieHereticMappedMock.slug)).ratings,
      });

      expect(result).to.deep.equal(MovieHereticRatingsMappedMock);
    });

    it('should read its earliest release date from its releases', async () => {
      const { earliestReleaseDate } = await renderMovie();

      expect(await readKnown(earliestReleaseDate)).toEqual(
        MovieHereticReleasesMappedMock,
      );
    });

    it('should read the earliest release date as not known while the releases load', async () => {
      const releases = holdRequest({
        method: 'get',
        url: HERETIC_RELEASES_URL,
      });
      const { movie, earliestReleaseDate } = await renderMovie();
      const earliest = readKnown(earliestReleaseDate);
      await readKnown(movie);
      await releases.requested;

      const whileLoading = await settleWithin(earliest, NEGATIVE_CLAIM_WINDOW);
      releases.release();

      expect(whileLoading).toBe('pending');
      expect(await earliest).toEqual(MovieHereticReleasesMappedMock);
    });

    it('should fall back to the release date when the releases fail', async () => {
      serveReleases(notFound);
      const { earliestReleaseDate } = await renderMovie();

      expect(await readKnown(earliestReleaseDate))
        .toEqual(MovieHereticMappedMock.effectiveReleaseDate);
    });

    it('should fall back to the release date when it has no releases', async () => {
      serveReleases(() => HttpResponse.json([]));
      const { earliestReleaseDate } = await renderMovie();

      expect(await readKnown(earliestReleaseDate))
        .toEqual(MovieHereticMappedMock.effectiveReleaseDate);
    });

    it('should read the comments as error when the stats fail, then ready once a retry lands', async () => {
      serveStats(notFound);
      const { status } = await renderCommentsStatus();
      const kinds = kindsOf(status);
      const failed = await nextOf(status, 'error');

      serveStats(() => HttpResponse.json(MovieHereticStatsResponseMock));
      failed.retry();
      const ready = await nextOf(status, 'ready');

      expect(ready.data).toBe(MovieHereticStatsMappedMock.comments);
      expect(kinds).toEqual(['loading', 'error', 'loading', 'ready']);
    });

    it('should read the comments as empty when there are none', async () => {
      serveStats(() =>
        HttpResponse.json({ ...MovieHereticStatsResponseMock, comments: 0 })
      );
      const { status } = await renderCommentsStatus();

      expect(await nextOf(status, 'empty')).toEqual({ kind: 'empty' });
    });
  });
  describe('cast', () => {
    function renderCastStatus() {
      return renderStore(() => ({
        status: useMovie(valueObservable(MovieHereticMappedMock.slug))
          .castStatus,
      }));
    }

    it('should read the cast as its one group', async () => {
      const { status } = await renderCastStatus();

      const ready = await nextOf(status, 'ready');

      expect(ready.data).toEqual([
        { key: 'cast', members: MovieHereticPeopleMappedMock.cast },
      ]);
    });

    it('should read no cast as empty', async () => {
      server.use(
        http.get(
          HERETIC_PEOPLE_URL,
          () => HttpResponse.json({ cast: [], crew: {} }),
        ),
      );
      const { status } = await renderCastStatus();

      expect(await nextOf(status, 'empty')).toEqual({ kind: 'empty' });
    });
  });
  describe('related', () => {
    function renderRelatedStatus(
      slug$ = valueObservable(MovieHereticMappedMock.slug),
    ) {
      return renderStore(() => ({ status: useMovie(slug$).relatedStatus }));
    }

    it('should read the related movies as cards', async () => {
      const { status } = await renderRelatedStatus();

      const ready = await nextOf(status, 'ready');

      expect(ready.data).toEqual(
        MovieHereticRelatedMappedMock.map((movie) => ({
          type: 'movie',
          movie,
        })),
      );
    });

    it('should read the related movies as empty when there are none', async () => {
      server.use(http.get(HERETIC_RELATED_URL, () => HttpResponse.json([])));
      const { status } = await renderRelatedStatus();

      expect(await nextOf(status, 'empty')).toEqual({ kind: 'empty' });
    });

    it("should read the new title's related movies once the slug changes", async () => {
      server.use(
        http.get(
          `http://localhost/movies/${MovieMatrixMappedMock.slug}/related`,
          () => HttpResponse.json([MovieHereticResponseMock]),
        ),
      );
      const slug$ = new BehaviorSubject(MovieHereticMappedMock.slug);
      const { status } = await renderRelatedStatus(slug$);
      const kinds = kindsOf(status);
      await nextOf(status, 'ready');

      slug$.next(MovieMatrixMappedMock.slug);
      const ready = await nextOf(status, 'ready');

      expect(ready.data).toEqual([
        { type: 'movie', movie: MovieHereticMappedMock },
      ]);
      expect(kinds).toEqual(['loading', 'ready', 'loading', 'ready']);
    });
  });

  describe('lists', () => {
    function renderListsStatus() {
      return renderStore(() => ({
        status: useMovie(valueObservable(MovieHereticMappedMock.slug))
          .listsStatus,
      }));
    }

    it('should read the official lists, then the personal ones', async () => {
      const { status } = await renderListsStatus();

      const ready = await nextOf(status, 'ready');

      expect(ready.data).toEqual([
        ...OfficialListsMappedMock,
        ...HereticListsMappedMock,
      ]);
    });

    it('should read the lists as empty when neither read has any', async () => {
      server.use(
        http.get(HERETIC_OFFICIAL_LISTS_URL, () => HttpResponse.json([])),
        http.get(HERETIC_PERSONAL_LISTS_URL, () => HttpResponse.json([])),
      );
      const { status } = await renderListsStatus();

      expect(await nextOf(status, 'empty')).toEqual({ kind: 'empty' });
    });

    it('should read the lists as error when the personal lists fail, then ready once a retry lands', async () => {
      server.use(http.get(HERETIC_PERSONAL_LISTS_URL, notFound));
      const { status } = await renderListsStatus();
      const kinds = kindsOf(status);
      const failed = await nextOf(status, 'error');

      server.use(
        http.get(
          HERETIC_PERSONAL_LISTS_URL,
          () => HttpResponse.json(HereticListsResponseMock),
        ),
      );
      failed.retry();
      const ready = await nextOf(status, 'ready');

      expect(ready.data).toEqual([
        ...OfficialListsMappedMock,
        ...HereticListsMappedMock,
      ]);
      expect(kinds).toEqual(['loading', 'error', 'loading', 'ready']);
    });
  });
});
