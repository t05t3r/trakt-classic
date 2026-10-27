import { OfficialListsMappedMock } from '$mocks/data/lists/mapped/OfficialListsMappedMock.ts';
import { SILO_SEASON_OFFICIAL_LISTS_URL } from '$mocks/data/shows/SILO_SEASON_OFFICIAL_LISTS_URL.ts';
import { SILO_SEASON_PERSONAL_LISTS_URL } from '$mocks/data/shows/SILO_SEASON_PERSONAL_LISTS_URL.ts';
import { SiloListsMappedMock } from '$mocks/data/summary/shows/silo/mapped/SiloListsMappedMock.ts';
import { SILO_SEASON_PARAMS } from '$mocks/data/shows/SILO_SEASON_PARAMS.ts';
import { SeasonSiloMappedMock } from '$mocks/data/summary/seasons/silo/mapped/SeasonSiloMappedMock.ts';
import { isPlaceholder } from '$lib/features/image/isPlaceholder.ts';
import { PLACEHOLDERS } from '$lib/features/image/placeholders.ts';
import { SPECIALS } from '$lib/utils/media/SPECIALS.ts';
import { SILO_PROGRESS_URL } from '$mocks/data/shows/SILO_PROGRESS_URL.ts';
import { SILO_SEASON_ONE_EPISODES_URL } from '$mocks/data/shows/SILO_SEASON_ONE_EPISODES_URL.ts';
import { SILO_SEASONS_URL } from '$mocks/data/shows/SILO_SEASONS_URL.ts';
import { SILO_SEASON_PEOPLE_URL } from '$mocks/data/shows/SILO_SEASON_PEOPLE_URL.ts';
import { SILO_SEASON_SUMMARY_URL } from '$mocks/data/shows/SILO_SEASON_SUMMARY_URL.ts';
import { SeasonSiloResponseMock } from '$mocks/data/summary/seasons/silo/response/SeasonSiloResponseMock.ts';
import { server } from '$mocks/server.ts';
import { ShowSiloProgressMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloProgressMappedMock.ts';
import { ShowSiloProgressResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloProgressResponseMock.ts';
import { SeasonSiloStatsMappedMock } from '$mocks/data/summary/seasons/silo/mapped/SeasonSiloStatsMappedMock.ts';
import { ShowSiloPeopleMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloPeopleMappedMock.ts';
import { ShowSiloPeopleResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloPeopleResponseMock.ts';
import type { PeopleGuestStarsResponse } from '$lib/requests/models/PeopleGuestStarsResponse.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { ShowSiloSeasonEpisodesMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloSeasonEpisodesMappedMock.ts';
import { ShowSiloSeasonsWithSpecialsResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloSeasonsWithSpecialsResponseMock.ts';
import { ShowSiloSeasonsResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloSeasonsResponseMock.ts';
import { ShowSiloSeasonFourResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloSeasonFourResponseMock.ts';
import { isEmpty } from '$lib/utils/array/isEmpty.ts';
import { kindsOf } from '$test/beds/query/kindsOf.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { nextOf } from '$test/beds/query/nextOf.ts';
import { notFound } from '$test/beds/request/notFound.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { readKnown } from '$test/beds/store/readKnown.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { valueObservable } from '$test/beds/store/valueObservable.ts';
import type { SeasonsResponse } from '@trakt/api';
import { http, HttpResponse } from 'msw';
import { filter, firstValueFrom, type Observable } from 'rxjs';
import { ShowDevsMappedMock } from '$mocks/data/summary/shows/devs/ShowDevsMappedMock.ts';
import { readSettled } from '$test/beds/store/readSettled.ts';
import { readsAfterParamsChange } from '$test/beds/store/readsAfterParamsChange.ts';
import { serveDevs } from '$test/beds/summary/serveDevs.ts';
import { describe, expect, it } from 'vitest';
import { type SeasonParams, useSeason } from './useSeason.ts';

function serveSeason(body: SeasonsResponse[0]) {
  server.use(http.get(SILO_SEASON_SUMMARY_URL, () => HttpResponse.json(body)));
}

function servePeople(body: PeopleGuestStarsResponse) {
  server.use(http.get(SILO_SEASON_PEOPLE_URL, () => HttpResponse.json(body)));
}

function serveSeasons(body: SeasonsResponse) {
  server.use(http.get(SILO_SEASONS_URL, () => HttpResponse.json(body)));
}

// Silo's seasons with season 4, which lists no episodes yet; the page's own season reads fail, as these tests read only the list.
function serveWithSeasonFour({ season }: SeasonParams) {
  serveSeasons([
    ...ShowSiloSeasonsResponseMock,
    ShowSiloSeasonFourResponseMock,
  ]);
  server.use(http.get(`${SILO_SEASONS_URL}/${season}/*`, notFound));
}

const SEASON_FOUR: SeasonParams = { ...SILO_SEASON_PARAMS, season: 4 };

const SEASON_THREE: SeasonParams = { ...SILO_SEASON_PARAMS, season: 3 };

const DEVS_SEASON_TWO: SeasonParams = {
  slug: ShowDevsMappedMock.slug,
  season: 2,
};

function serveSeasonsFailure() {
  server.use(http.get(SILO_SEASONS_URL, notFound));
}

function readLoadedPoster(poster: Observable<string>) {
  return firstValueFrom(poster.pipe(filter((src) => !isPlaceholder(src))));
}

function readProgress(params: SeasonParams = SILO_SEASON_PARAMS) {
  return renderStore(() =>
    useSeason(valueObservable(params)).progressStatus.pipe(
      filter((status) => status !== undefined),
    )
  );
}

function renderSeason(params: SeasonParams = SILO_SEASON_PARAMS) {
  return renderStore(() => useSeason(valueObservable(params)));
}

describe('store: useSeason', () => {
  describe('season: Silo season 1', () => {
    it('should contain the summary', async () => {
      const { season } = await renderSeason();

      expect(await readKnown(season)).toEqual(SeasonSiloMappedMock);
    });

    it("should contain the show's summary", async () => {
      const { show } = await renderSeason();

      expect(await readKnown(show)).toEqual(ShowSiloMappedMock);
    });

    it('should return its stats', async () => {
      const { stats } = await renderSeason();

      expect(await readKnown(stats)).toEqual(SeasonSiloStatsMappedMock);
    });
  });

  describe('year', () => {
    it('should read the year it first aired', async () => {
      serveSeason({
        ...SeasonSiloResponseMock,
        first_aired: '2022-12-31T23:00:00.000Z',
      });
      const { year } = await renderSeason();

      expect(await readKnown(year)).toBe(2022);
    });

    it('should read no year for a season with no air date', async () => {
      serveSeason({ ...SeasonSiloResponseMock, first_aired: undefined });
      const { season, year } = await renderSeason();
      await readKnown(season);

      expect(await firstValueFrom(year)).toBeUndefined();
    });
  });

  describe('poster', () => {
    it('should be the Placeholder while the season loads', async () => {
      holdRequest({ method: 'get', url: SILO_SEASON_SUMMARY_URL });
      const { show, poster } = await renderSeason();
      await readKnown(show);

      expect(await firstValueFrom(poster)).toBe(PLACEHOLDERS.poster);
    });

    it("should be the season's poster", async () => {
      const { poster } = await renderSeason();

      expect(await readLoadedPoster(poster))
        .toBe(SeasonSiloMappedMock.poster?.url.thumb);
    });

    it("should be the show's poster when the season has none", async () => {
      serveSeason({
        ...SeasonSiloResponseMock,
        images: { poster: [], thumb: [] },
      });
      const { poster } = await renderSeason();

      expect(await readLoadedPoster(poster))
        .toBe(ShowSiloMappedMock.poster.url.thumb);
    });
  });

  describe('ratings', () => {
    it("should read the Trakt rating and votes from the season's summary", async () => {
      const { ratings } = await renderSeason();

      expect(await readKnown(ratings)).toEqual({
        trakt: {
          rating: SeasonSiloMappedMock.rating,
          votes: SeasonSiloMappedMock.votes,
        },
      });
    });

    it.each([
      ['rating', { rating: null }],
      ['votes', { votes: null }],
    ])(
      'should read no ratings for a season with no %s',
      async (_, missing) => {
        serveSeason({ ...SeasonSiloResponseMock, ...missing });
        const { season, ratings } = await renderSeason();
        await readKnown(season);

        expect(await firstValueFrom(ratings)).toBeUndefined();
      },
    );
  });

  describe('comments', () => {
    it('should read the comments count from the stats', async () => {
      const { commentsStatus } = await renderSeason();

      const ready = await nextOf(commentsStatus, 'ready');

      expect(ready.data).toBe(SeasonSiloStatsMappedMock.comments);
    });
  });

  describe('cast', () => {
    it('should read the Season Regulars, then the Guest Stars, with their episode counts', async () => {
      const { castStatus } = await renderSeason();

      const ready = await nextOf(castStatus, 'ready');

      expect(ready.data).toEqual([
        { key: 'seasonRegulars', members: ShowSiloPeopleMappedMock.cast },
        { key: 'guest', members: ShowSiloPeopleMappedMock.guestStars },
      ]);
    });

    it('should keep the Guest Stars group when there are none', async () => {
      servePeople({ ...ShowSiloPeopleResponseMock, guest_stars: null });
      const { castStatus } = await renderSeason();

      const ready = await nextOf(castStatus, 'ready');

      expect(ready.data).toEqual([
        { key: 'seasonRegulars', members: ShowSiloPeopleMappedMock.cast },
        { key: 'guest', members: [] },
      ]);
    });

    it('should read no cast as empty', async () => {
      servePeople({ cast: [], crew: {} });
      const { castStatus } = await renderSeason();

      expect(await nextOf(castStatus, 'empty')).toEqual({ kind: 'empty' });
    });
  });

  describe('progress', () => {
    it("should read the season's entry in the show's progress", async () => {
      const status = await readProgress();

      const ready = await nextOf(status, 'ready');

      expect(ready.data).toEqual(ShowSiloProgressMappedMock.seasons.at(0));
    });

    it('should read a season the progress does not list as empty', async () => {
      server.use(
        http.get(SILO_PROGRESS_URL, () =>
          HttpResponse.json({
            ...ShowSiloProgressResponseMock,
            seasons: ShowSiloProgressResponseMock.seasons
              .filter(({ number }) => number !== SILO_SEASON_PARAMS.season),
          })),
      );
      const status = await readProgress();
      const kinds = kindsOf(status);

      await nextOf(status, 'empty');

      expect(kinds).toEqual(['loading', 'empty']);
    });

    it('should read no progress for the specials', async () => {
      server.use(http.get(`${SILO_SEASONS_URL}/${SPECIALS}/*`, notFound));
      const read = await readSettled(() =>
        useSeason(valueObservable({ ...SILO_SEASON_PARAMS, season: SPECIALS }))
          .progressStatus
      );

      expect(read).toBeUndefined();
    });
  });

  describe('seasons', () => {
    it('should be empty while the seasons load', async () => {
      holdRequest({ method: 'get', url: SILO_SEASONS_URL });
      const { show, seasons } = await renderSeason();
      await readKnown(show);

      expect(await firstValueFrom(seasons)).toEqual([]);
    });

    it('should be empty when the seasons fail', async () => {
      serveSeasonsFailure();
      const read = await readSettled(() =>
        useSeason(valueObservable(SILO_SEASON_PARAMS)).seasons
      );

      expect(read).toEqual([]);
    });

    it('should list the seasons by number, newest first, the specials last', async () => {
      serveSeasons(ShowSiloSeasonsWithSpecialsResponseMock);

      const loaded = await runQuery({
        factory: () => useSeason(valueObservable(SILO_SEASON_PARAMS)).seasons,
        waitFor: (seasons) => !isEmpty(seasons),
      });

      expect(loaded.map(({ number }) => number)).toEqual([3, 2, 1, 0]);
    });

    it('should list a season with no episodes yet on its own page', async () => {
      serveWithSeasonFour(SEASON_FOUR);

      const loaded = await runQuery({
        factory: () => useSeason(valueObservable(SEASON_FOUR)).seasons,
        waitFor: (seasons) => !isEmpty(seasons),
      });

      expect(loaded.map(({ number }) => number)).toEqual([4, 3, 2, 1]);
    });
  });

  describe('neighbours', () => {
    it('should link none while the seasons load', async () => {
      holdRequest({ method: 'get', url: SILO_SEASONS_URL });
      const { show, neighbours } = await renderSeason();
      await readKnown(show);

      expect(await firstValueFrom(neighbours)).toEqual({});
    });

    it('should link none when the seasons fail', async () => {
      serveSeasonsFailure();
      const read = await readSettled(() =>
        useSeason(valueObservable(SILO_SEASON_PARAMS)).neighbours
      );

      expect(read).toEqual({});
    });

    it('should link the seasons either side', async () => {
      serveSeasons(ShowSiloSeasonsWithSpecialsResponseMock);

      const neighbours = await runQuery({
        factory: () =>
          useSeason(valueObservable(SILO_SEASON_PARAMS)).neighbours,
        waitFor: ({ next }) => next !== undefined,
      });

      expect(neighbours).toEqual({
        previous: '/shows/silo/seasons/0',
        next: '/shows/silo/seasons/2',
      });
    });

    it('should link back from a season with no episodes yet, and on to none', async () => {
      serveWithSeasonFour(SEASON_FOUR);

      const neighbours = await runQuery({
        factory: () => useSeason(valueObservable(SEASON_FOUR)).neighbours,
        waitFor: ({ previous }) => previous !== undefined,
      });

      expect(neighbours).toEqual({ previous: '/shows/silo/seasons/3' });
    });

    it('should link on to a season with no episodes yet', async () => {
      serveWithSeasonFour(SEASON_THREE);

      const neighbours = await runQuery({
        factory: () => useSeason(valueObservable(SEASON_THREE)).neighbours,
        waitFor: ({ previous }) => previous !== undefined,
      });

      expect(neighbours).toEqual({
        previous: '/shows/silo/seasons/2',
        next: '/shows/silo/seasons/4',
      });
    });

    it("should build no links from the left show's seasons once the params name another show", async () => {
      // Two seasons, so Silo's list would link on past season 2.
      serveDevs(ShowSiloSeasonsResponseMock.slice(0, 2));

      const reads = await readsAfterParamsChange({
        from: SILO_SEASON_PARAMS,
        to: DEVS_SEASON_TWO,
        store: useSeason,
        pick: ({ neighbours }) => neighbours,
        loadedFrom: ({ neighbours }) =>
          firstValueFrom(neighbours.pipe(filter(({ next }) => !!next))),
        loadedTo: ({ neighbours }) =>
          firstValueFrom(neighbours.pipe(filter(({ previous }) => !!previous))),
      });

      const linked = reads.filter(({ previous, next }) => previous || next);
      expect(linked).not.toHaveLength(0);
      linked.forEach((links) =>
        expect(links).toEqual({ previous: '/shows/devs/seasons/1' })
      );
    });
  });

  describe('lists', () => {
    it('should read the official lists, then the personal ones', async () => {
      const { listsStatus } = await renderSeason();

      const ready = await nextOf(listsStatus, 'ready');

      expect(ready.data).toEqual([
        ...OfficialListsMappedMock,
        ...SiloListsMappedMock,
      ]);
    });

    it('should read the lists as empty when neither read has any', async () => {
      server.use(
        http.get(SILO_SEASON_OFFICIAL_LISTS_URL, () => HttpResponse.json([])),
        http.get(SILO_SEASON_PERSONAL_LISTS_URL, () => HttpResponse.json([])),
      );
      const { listsStatus } = await renderSeason();

      expect(await nextOf(listsStatus, 'empty')).toEqual({ kind: 'empty' });
    });
  });

  describe('episodes', () => {
    it("should read the season's episodes as ready", async () => {
      const { episodesStatus } = await renderSeason();

      const ready = await nextOf(episodesStatus, 'ready');

      expect(ready.data).toEqual(ShowSiloSeasonEpisodesMappedMock);
    });

    it('should read a season with no episodes as empty', async () => {
      server.use(
        http.get(SILO_SEASON_ONE_EPISODES_URL, () => HttpResponse.json([])),
      );
      const { episodesStatus } = await renderSeason();

      expect(await nextOf(episodesStatus, 'empty')).toEqual({ kind: 'empty' });
    });

    it("should count the season's episodes", async () => {
      const { episodeCount } = await renderSeason();

      expect(await readKnown(episodeCount)).toBe(10);
    });

    it('should not count the episodes while they load', async () => {
      holdRequest({ method: 'get', url: SILO_SEASON_ONE_EPISODES_URL });
      const { episodeCount } = await renderSeason();

      expect(await firstValueFrom(episodeCount)).toBeUndefined();
    });
  });
});
