import { OfficialListsMappedMock } from '$mocks/data/lists/mapped/OfficialListsMappedMock.ts';
import { SILO_EPISODE_OFFICIAL_LISTS_URL } from '$mocks/data/shows/SILO_EPISODE_OFFICIAL_LISTS_URL.ts';
import { SILO_EPISODE_PERSONAL_LISTS_URL } from '$mocks/data/shows/SILO_EPISODE_PERSONAL_LISTS_URL.ts';
import { SiloListsMappedMock } from '$mocks/data/summary/shows/silo/mapped/SiloListsMappedMock.ts';
import { SILO_EPISODE_PARAMS } from '$mocks/data/shows/SILO_EPISODE_PARAMS.ts';
import { EpisodeSiloMappedMock } from '$mocks/data/summary/episodes/silo/mapped/EpisodeSiloMappedMock.ts';
import { EpisodeSiloPeopleMappedMock } from '$mocks/data/summary/episodes/silo/mapped/EpisodeSiloPeopleMappedMock.ts';
import { EpisodeSiloRatingsMappedMock } from '$mocks/data/summary/episodes/silo/mapped/EpisodeSiloRatingsMappedMock.ts';
import { EpisodeSiloStatsMappedMock } from '$mocks/data/summary/episodes/silo/mapped/EpisodeSiloStatsMappedMock.ts';
import { SILO_EPISODE_SUMMARY_URL } from '$mocks/data/shows/SILO_EPISODE_SUMMARY_URL.ts';
import { EpisodeSiloResponseMock } from '$mocks/data/summary/episodes/silo/response/EpisodeSiloResponseMock.ts';
import { server } from '$mocks/server.ts';
import { SILO_EPISODE_PEOPLE_URL } from '$mocks/data/shows/SILO_EPISODE_PEOPLE_URL.ts';
import { EpisodeSiloPeopleResponseMock } from '$mocks/data/summary/episodes/silo/response/EpisodeSiloPeopleResponseMock.ts';
import { nextOf } from '$test/beds/query/nextOf.ts';
import { SILO_SEASONS_URL } from '$mocks/data/shows/SILO_SEASONS_URL.ts';
import { ShowSiloSeasonsMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloSeasonsMappedMock.ts';
import { ShowSiloSeasonsResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloSeasonsResponseMock.ts';
import { ShowSiloSeasonsEmptySeasonTwoResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloSeasonsEmptySeasonTwoResponseMock.ts';
import { isPlaceholder } from '$lib/features/image/isPlaceholder.ts';
import { PLACEHOLDERS } from '$lib/features/image/placeholders.ts';
import type { CastMember } from '$lib/requests/models/MediaCrew.ts';
import type { PeopleGuestStarsResponse } from '$lib/requests/models/PeopleGuestStarsResponse.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { SILO_SEASON_ONE_EPISODES_URL } from '$mocks/data/shows/SILO_SEASON_ONE_EPISODES_URL.ts';
import { ShowSiloSeasonEpisodesMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloSeasonEpisodesMappedMock.ts';
import { ShowSiloSeasonEpisodesResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloSeasonEpisodesResponseMock.ts';
import { SILO_SEASON_TWO_EPISODES_URL } from '$mocks/data/shows/SILO_SEASON_TWO_EPISODES_URL.ts';
import { SILO_SEASON_THREE_EPISODES_URL } from '$mocks/data/shows/SILO_SEASON_THREE_EPISODES_URL.ts';
import { ShowSiloSeasonTwoEpisodesMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloSeasonTwoEpisodesMappedMock.ts';
import { ShowSiloSeasonTwoEpisodesResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloSeasonTwoEpisodesResponseMock.ts';
import { captureRequests } from '$test/beds/request/captureRequests.ts';
import { collectDistinctStates } from '$test/beds/store/collectDistinctStates.ts';
import { isEmpty } from '$lib/utils/array/isEmpty.ts';
import { notFound } from '$test/beds/request/notFound.ts';
import type { EpisodeResponse, SeasonsResponse } from '@trakt/api';
import { http, HttpResponse } from 'msw';
import {
  combineLatest,
  distinctUntilChanged,
  filter,
  firstValueFrom,
  map,
  type Observable,
} from 'rxjs';
import { DEVS_SUMMARY_URL } from '$mocks/data/shows/DEVS_SUMMARY_URL.ts';
import { ShowDevsMappedMock } from '$mocks/data/summary/shows/devs/ShowDevsMappedMock.ts';
import { ShowDevsResponseMock } from '$mocks/data/summary/shows/devs/ShowDevsResponseMock.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { useWaitForLateRequests } from '$test/beds/query/useWaitForLateRequests.ts';
import { readKnown } from '$test/beds/store/readKnown.ts';
import { readSettled } from '$test/beds/store/readSettled.ts';
import { readsAfterParamsChange } from '$test/beds/store/readsAfterParamsChange.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { serveDevs } from '$test/beds/summary/serveDevs.ts';
import { valueObservable } from '$test/beds/store/valueObservable.ts';
import { describe, expect, it } from 'vitest';
import type { CastGroup } from '../_internal/CastGroup.ts';
import type { Neighbours } from '../_internal/toNeighbours.ts';
import { type EpisodeParams, useEpisode } from './useEpisode.ts';

function serveEpisode(body: EpisodeResponse) {
  server.use(http.get(SILO_EPISODE_SUMMARY_URL, () => HttpResponse.json(body)));
}

function servePeople(body: PeopleGuestStarsResponse) {
  server.use(http.get(SILO_EPISODE_PEOPLE_URL, () => HttpResponse.json(body)));
}

const nameOf = ({ name }: CastMember) => name;

const namesOf = (groups: ReadonlyArray<CastGroup>) =>
  groups.map(({ key, members }) => [key, members.map(nameOf)]);

function serveSeasons(answer: () => Response) {
  server.use(http.get(SILO_SEASONS_URL, answer));
}

const SEASON_ONE = ShowSiloSeasonsMappedMock.at(0);

const SEASON_TWO = ShowSiloSeasonsMappedMock.at(1);

const NO_SEASON_ONE: SeasonsResponse = ShowSiloSeasonsResponseMock
  .filter(({ number }) => number !== 1);

const SEASON_ONE_WITHOUT_POSTER: SeasonsResponse = ShowSiloSeasonsResponseMock
  .map((season) =>
    season.number === 1
      ? { ...season, images: { poster: [], thumb: season.images?.thumb ?? [] } }
      : season
  );

function serveSeasonOne(body: ReadonlyArray<EpisodeResponse>) {
  server.use(
    http.get(SILO_SEASON_ONE_EPISODES_URL, () => HttpResponse.json(body)),
  );
}

const SEASON_ONE_EPISODE_TEN: EpisodeParams = {
  ...SILO_EPISODE_PARAMS,
  episode: 10,
};

const SEASON_ONE_EPISODE_TEN_WITHIN: Neighbours = {
  previous: '/shows/silo/seasons/1/episodes/9',
};

const SEASON_TWO_EPISODE_SEVEN: EpisodeParams = {
  ...SILO_EPISODE_PARAMS,
  season: 2,
  episode: 7,
};

const SEASON_TWO_EPISODE_ONE: EpisodeParams = {
  ...SILO_EPISODE_PARAMS,
  season: 2,
  episode: 1,
};

const SEASON_TWO_EPISODE_TEN: EpisodeParams = {
  ...SILO_EPISODE_PARAMS,
  season: 2,
  episode: 10,
};

const SEASON_TWO_EPISODE_SEVEN_LINKS: Neighbours = {
  previous: '/shows/silo/seasons/2/episodes/6',
  next: '/shows/silo/seasons/2/episodes/8',
};

const DEVS_EPISODE_EIGHT: EpisodeParams = {
  slug: ShowDevsMappedMock.slug,
  season: 1,
  episode: 8,
};

const DEVS_EPISODE_EIGHT_LINKS: Neighbours = {
  previous: '/shows/devs/seasons/1/episodes/7',
};

function serveSeasonTwo(body: ReadonlyArray<EpisodeResponse>) {
  server.use(
    http.get(`${SILO_SEASONS_URL}/2/*`, notFound),
    http.get(SILO_SEASON_TWO_EPISODES_URL, () => HttpResponse.json(body)),
  );
}

// Season 3's list fails, so season 2's links settle within it.
function serveSeasonTwoEpisodes() {
  serveSeasonTwo(ShowSiloSeasonTwoEpisodesResponseMock);
  server.use(http.get(SILO_SEASON_THREE_EPISODES_URL, notFound));
}

// Season 1 shorter than season 2, so its list would end the links at episode 7.
function serveShorterSeasonOne() {
  serveSeasonOne(ShowSiloSeasonEpisodesResponseMock.slice(0, 7));
  serveSeasonTwoEpisodes();
}

// One season of eight episodes, so Silo's lists would link on past episode 8.
const serveDevsSeasonOne = () =>
  serveDevs(ShowSiloSeasonsResponseMock.slice(0, 1));

type ChangeCase<T> = {
  from?: EpisodeParams;
  to: EpisodeParams;
  settled: Neighbours;
  pick: (store: ReturnType<typeof useEpisode>) => Observable<T>;
};

const isSameLinks = (a: Neighbours, b: Neighbours) =>
  a.previous === b.previous && a.next === b.next;

// Every read emitted under the new params, until the links settle on `settled`.
function readsAfterChange<T>(
  { from = SILO_EPISODE_PARAMS, to, settled, pick }: ChangeCase<T>,
) {
  return readsAfterParamsChange({
    from,
    to,
    store: useEpisode,
    pick,
    loadedFrom: ({ neighbours }) =>
      firstValueFrom(neighbours.pipe(filter(({ next }) => !!next))),
    loadedTo: ({ neighbours }) =>
      firstValueFrom(
        neighbours.pipe(filter((links) => isSameLinks(links, settled))),
      ),
  });
}

function readLoadedPoster(
  seasonPoster: Observable<{ src: string; seasonId?: number }>,
) {
  return firstValueFrom(
    seasonPoster.pipe(filter(({ src }) => !isPlaceholder(src))),
  );
}

function renderEpisode(params = SILO_EPISODE_PARAMS) {
  return renderStore(() => useEpisode(valueObservable(params)));
}

function readNeighbours(params = SILO_EPISODE_PARAMS) {
  return runQuery({
    factory: () => useEpisode(valueObservable(params)).neighbours,
    waitFor: ({ next }) => next !== undefined,
  });
}

describe('store: useEpisode', () => {
  describe('episode: Silo 1x01', () => {
    it('should contain the summary', async () => {
      const { episode } = await renderEpisode();

      expect(await readKnown(episode)).toEqual(EpisodeSiloMappedMock);
    });

    it("should contain the show's summary", async () => {
      const { show } = await renderEpisode();

      expect(await readKnown(show)).toEqual(ShowSiloMappedMock);
    });

    it('should return its stats', async () => {
      const { stats } = await renderEpisode();

      expect(await readKnown(stats)).toEqual(EpisodeSiloStatsMappedMock);
    });

    it('should return its ratings', async () => {
      const { ratings } = await renderEpisode();

      expect(await readKnown(ratings)).toEqual(EpisodeSiloRatingsMappedMock);
    });

    it('should return its crew', async () => {
      const result = await runQuery({
        factory: () => useEpisode(valueObservable(SILO_EPISODE_PARAMS)).crew,
        waitFor: (crew) => crew.cast.length !== 0,
      });

      expect(result).toEqual(EpisodeSiloPeopleMappedMock);
    });

    it('should read its earliest release date as its effective release date', async () => {
      const { earliestReleaseDate } = await renderEpisode();

      expect(await readKnown(earliestReleaseDate))
        .toEqual(EpisodeSiloMappedMock.effectiveReleaseDate);
    });
  });

  describe('comments', () => {
    it('should read the comments count from the stats', async () => {
      const { commentsStatus } = await renderEpisode();

      const ready = await nextOf(commentsStatus, 'ready');

      expect(ready.data).toBe(EpisodeSiloStatsMappedMock.comments);
    });
  });

  describe('cast', () => {
    it('should read the Season Regulars, then the Guest Stars', async () => {
      const { castStatus } = await renderEpisode();

      const ready = await nextOf(castStatus, 'ready');

      expect(namesOf(ready.data)).toEqual([
        ['seasonRegulars', EpisodeSiloPeopleMappedMock.cast.map(nameOf)],
        ['guest', EpisodeSiloPeopleMappedMock.guestStars.map(nameOf)],
      ]);
    });

    it('should drop the episode counts on both tabs', async () => {
      const { castStatus } = await renderEpisode();

      const ready = await nextOf(castStatus, 'ready');

      expect(
        ready.data.flatMap(({ members }) =>
          members.filter((member) => 'episodeCount' in member)
        ),
      ).toEqual([]);
    });

    it('should keep the Guest Stars group when there are none', async () => {
      servePeople({ ...EpisodeSiloPeopleResponseMock, guest_stars: null });
      const { castStatus } = await renderEpisode();

      const ready = await nextOf(castStatus, 'ready');

      expect(namesOf(ready.data)).toEqual([
        ['seasonRegulars', EpisodeSiloPeopleMappedMock.cast.map(nameOf)],
        ['guest', []],
      ]);
    });

    it('should read no cast as empty', async () => {
      servePeople({ cast: [], crew: {} });
      const { castStatus } = await renderEpisode();

      expect(await nextOf(castStatus, 'empty')).toEqual({ kind: 'empty' });
    });
  });

  describe('backdrop', () => {
    it('should be the full screenshot', async () => {
      const { backdrop } = await renderEpisode();

      expect(await readKnown(backdrop))
        .toBe(EpisodeSiloMappedMock.cover.url.full);
    });

    it("should be the show's full fanart when the screenshot is a Placeholder", async () => {
      serveEpisode({
        ...EpisodeSiloResponseMock,
        images: { ...EpisodeSiloResponseMock.images, screenshot: [] },
      });
      const { backdrop } = await renderEpisode();

      expect(await readKnown(backdrop))
        .toBe(ShowSiloMappedMock.cover.url.full);
    });
  });

  describe('season poster', () => {
    it('should be the Placeholder while the seasons load', async () => {
      holdRequest({ method: 'get', url: SILO_SEASONS_URL });
      const { show, seasonPoster } = await renderEpisode();
      await readKnown(show);

      expect(await firstValueFrom(seasonPoster))
        .toEqual({ src: PLACEHOLDERS.poster });
    });

    it("should be the season's poster, with the season's id", async () => {
      const { seasonPoster } = await renderEpisode();

      expect(await readLoadedPoster(seasonPoster)).toEqual({
        src: SEASON_ONE?.poster?.url.thumb,
        seasonId: SEASON_ONE?.id,
      });
    });

    it("should be the show's poster, with the season's id, when the season has none", async () => {
      serveSeasons(() => HttpResponse.json(SEASON_ONE_WITHOUT_POSTER));
      const { seasonPoster } = await renderEpisode();

      expect(await readLoadedPoster(seasonPoster)).toEqual({
        src: ShowSiloMappedMock.poster.url.thumb,
        seasonId: SEASON_ONE?.id,
      });
    });

    it("should be the show's poster, with no season id, when the season is not listed", async () => {
      serveSeasons(() => HttpResponse.json(NO_SEASON_ONE));
      const { seasonPoster } = await renderEpisode();

      expect(await readLoadedPoster(seasonPoster))
        .toEqual({ src: ShowSiloMappedMock.poster.url.thumb });
    });

    it("should be the season's poster, with the season's id, when the season's episode count reads 0", async () => {
      serveSeasonTwoEpisodes();
      serveSeasons(() =>
        HttpResponse.json(ShowSiloSeasonsEmptySeasonTwoResponseMock)
      );
      const { seasonPoster } = await renderEpisode(SEASON_TWO_EPISODE_SEVEN);

      expect(await readLoadedPoster(seasonPoster)).toEqual({
        src: SEASON_TWO?.poster?.url.thumb,
        seasonId: SEASON_TWO?.id,
      });
    });

    it("should be the show's poster, with no season id, when the seasons fail", async () => {
      serveSeasons(notFound);
      const { seasonPoster } = await renderEpisode();

      expect(await readLoadedPoster(seasonPoster))
        .toEqual({ src: ShowSiloMappedMock.poster.url.thumb });
    });

    it("should build no poster from the left show's seasons once the params name another", async () => {
      serveDevs(SEASON_ONE_WITHOUT_POSTER.filter(({ number }) => number === 1));
      server.use(
        http.get(
          DEVS_SUMMARY_URL,
          () => HttpResponse.json(ShowDevsResponseMock),
        ),
      );

      const reads = await readsAfterChange({
        to: DEVS_EPISODE_EIGHT,
        settled: DEVS_EPISODE_EIGHT_LINKS,
        pick: ({ seasonPoster }) => seasonPoster,
      });

      const loaded = reads.filter(({ src }) => !isPlaceholder(src));
      expect(loaded).not.toHaveLength(0);
      loaded.forEach((poster) =>
        expect(poster).toEqual({
          src: ShowDevsMappedMock.poster.url.thumb,
          seasonId: SEASON_ONE?.id,
        })
      );
    });
  });

  describe('year', () => {
    it('should read the year it first aired', async () => {
      serveEpisode({
        ...EpisodeSiloResponseMock,
        first_aired: '2022-12-31T23:00:00.000Z',
        effective_release_date: '2023-01-01T01:00:00.000Z',
      });
      const { year } = await renderEpisode();

      expect(await readKnown(year)).toBe(2022);
    });

    it('should read no year for an episode with no air date', async () => {
      serveEpisode({ ...EpisodeSiloResponseMock, first_aired: null });
      const { episode, year } = await renderEpisode();
      await readKnown(episode);

      expect(await firstValueFrom(year)).toBeUndefined();
    });
  });

  describe('lists', () => {
    it('should read the official lists, then the personal ones', async () => {
      const { listsStatus } = await renderEpisode();

      const ready = await nextOf(listsStatus, 'ready');

      expect(ready.data).toEqual([
        ...OfficialListsMappedMock,
        ...SiloListsMappedMock,
      ]);
    });

    it('should read the lists as empty when neither read has any', async () => {
      server.use(
        http.get(SILO_EPISODE_OFFICIAL_LISTS_URL, () => HttpResponse.json([])),
        http.get(SILO_EPISODE_PERSONAL_LISTS_URL, () => HttpResponse.json([])),
      );
      const { listsStatus } = await renderEpisode();

      expect(await nextOf(listsStatus, 'empty')).toEqual({ kind: 'empty' });
    });
  });
  describe('episodes', () => {
    it("should be empty while the season's episodes load", async () => {
      holdRequest({ method: 'get', url: SILO_SEASON_ONE_EPISODES_URL });
      const { show, episodes } = await renderEpisode();
      await readKnown(show);

      expect(await firstValueFrom(episodes)).toEqual([]);
    });

    it("should list the season's episodes by number, ascending", async () => {
      serveSeasonOne(ShowSiloSeasonEpisodesResponseMock.toReversed());

      const episodes = await runQuery({
        factory: () =>
          useEpisode(valueObservable(SILO_EPISODE_PARAMS)).episodes,
        waitFor: (entries) => !isEmpty(entries),
      });

      expect(episodes).toEqual(ShowSiloSeasonEpisodesMappedMock);
    });

    it("should be empty when the season's episodes fail", async () => {
      server.use(http.get(SILO_SEASON_ONE_EPISODES_URL, notFound));
      const read = await readSettled(() =>
        useEpisode(valueObservable(SILO_EPISODE_PARAMS)).episodes
      );

      expect(read).toEqual([]);
    });

    it("should list none of the left season's episodes once the params name another", async () => {
      serveShorterSeasonOne();

      const reads = await readsAfterChange({
        to: SEASON_TWO_EPISODE_SEVEN,
        settled: SEASON_TWO_EPISODE_SEVEN_LINKS,
        pick: ({ episodes }) => episodes,
      });

      const loaded = reads.filter((entries) => !isEmpty(entries));
      expect(loaded).not.toHaveLength(0);
      loaded.forEach((entries) =>
        expect(entries).toEqual(ShowSiloSeasonTwoEpisodesMappedMock)
      );
    });
  });

  describe('neighbours', () => {
    it("should link none while the season's episodes load", async () => {
      holdRequest({ method: 'get', url: SILO_SEASON_ONE_EPISODES_URL });
      const { show, neighbours } = await renderEpisode();
      await readKnown(show);

      expect(await firstValueFrom(neighbours)).toEqual({});
    });

    it("should link none when the season's episodes fail", async () => {
      server.use(http.get(SILO_SEASON_ONE_EPISODES_URL, notFound));
      const read = await readSettled(() =>
        useEpisode(valueObservable(SILO_EPISODE_PARAMS)).neighbours
      );

      expect(read).toEqual({});
    });

    it('should link only within its season while the seasons load', async () => {
      holdRequest({ method: 'get', url: SILO_SEASONS_URL });

      const links = await runQuery({
        factory: () =>
          useEpisode(valueObservable(SEASON_ONE_EPISODE_TEN)).neighbours,
        waitFor: ({ previous }) => previous !== undefined,
      });

      expect(links).toEqual(SEASON_ONE_EPISODE_TEN_WITHIN);
    });

    it('should link only within its season when the seasons fail', async () => {
      serveSeasons(notFound);
      const read = await readSettled(() =>
        useEpisode(valueObservable(SEASON_ONE_EPISODE_TEN)).neighbours
      );

      expect(read).toEqual(SEASON_ONE_EPISODE_TEN_WITHIN);
    });

    it('should link the next episode in its season', async () => {
      expect(await readNeighbours())
        .toEqual({ next: '/shows/silo/seasons/1/episodes/2' });
    });

    it("should link on to the next season after the season's last episode", async () => {
      serveSeasonOne(ShowSiloSeasonEpisodesResponseMock.slice(0, 1));

      expect(await readNeighbours())
        .toEqual({ next: '/shows/silo/seasons/2/episodes/1' });
    });

    it('should link on past a season with no episodes, never reading its list', async () => {
      serveSeasons(() =>
        HttpResponse.json(ShowSiloSeasonsEmptySeasonTwoResponseMock)
      );
      server.use(
        http.get(SILO_SEASON_THREE_EPISODES_URL, () =>
          HttpResponse.json(
            ShowSiloSeasonTwoEpisodesResponseMock.map((entry) => ({
              ...entry,
              season: 3,
            })),
          )),
      );

      const { neighbours, waitForLateRequests } = await renderStore(() => ({
        neighbours: useEpisode(valueObservable(SEASON_ONE_EPISODE_TEN))
          .neighbours,
        waitForLateRequests: useWaitForLateRequests(),
      }));
      const requests = await captureRequests(async () => {
        expect(
          await firstValueFrom(
            neighbours.pipe(filter(({ next }) => next !== undefined)),
          ),
        ).toEqual({
          ...SEASON_ONE_EPISODE_TEN_WITHIN,
          next: '/shows/silo/seasons/3/episodes/1',
        });
        await waitForLateRequests();
      });

      expect(requests).not.toContain('GET /shows/silo/seasons/2');
    });

    it('should link on to the first episode the next season lists', async () => {
      serveSeasonOne(ShowSiloSeasonEpisodesResponseMock.slice(0, 1));
      serveSeasonTwo(ShowSiloSeasonTwoEpisodesResponseMock.slice(1));

      expect(await readNeighbours())
        .toEqual({ next: '/shows/silo/seasons/2/episodes/2' });
    });

    it("should link within its season while the next season's episodes load, and on once they land", async () => {
      const held = holdRequest({
        method: 'get',
        url: SILO_SEASON_TWO_EPISODES_URL,
      });
      const { neighbours } = await renderEpisode(SEASON_ONE_EPISODE_TEN);
      const reads = collectDistinctStates(neighbours);
      await held.requested;
      const within = await firstValueFrom(
        neighbours.pipe(filter(({ previous }) => !!previous)),
      );
      await waitNegativeClaim();
      const linkedOnWhileHeld = reads.filter(({ next }) => next);

      held.release();
      const across = await firstValueFrom(
        neighbours.pipe(filter(({ next }) => !!next)),
      );

      expect(within).toEqual(SEASON_ONE_EPISODE_TEN_WITHIN);
      expect(linkedOnWhileHeld).toEqual([]);
      expect(across).toEqual({
        ...SEASON_ONE_EPISODE_TEN_WITHIN,
        next: '/shows/silo/seasons/2/episodes/1',
      });
    });

    it('should link the other side when the season before fails', async () => {
      serveSeasonTwoEpisodes();
      server.use(http.get(SILO_SEASON_ONE_EPISODES_URL, notFound));

      expect(await readNeighbours(SEASON_TWO_EPISODE_ONE))
        .toEqual({ next: '/shows/silo/seasons/2/episodes/2' });
    });

    it("should build no link from the left params' next season once the params name another", async () => {
      serveSeasonTwo(ShowSiloSeasonTwoEpisodesResponseMock);
      server.use(
        http.get(
          SILO_SEASON_THREE_EPISODES_URL,
          () =>
            HttpResponse.json(
              ShowSiloSeasonEpisodesResponseMock.slice(1).map((entry) => ({
                ...entry,
                season: 3,
              })),
            ),
        ),
      );
      const within: Neighbours = {
        previous: '/shows/silo/seasons/2/episodes/9',
      };
      const settled: Neighbours = {
        ...within,
        next: '/shows/silo/seasons/3/episodes/2',
      };

      const reads = await readsAfterChange({
        to: SEASON_TWO_EPISODE_TEN,
        settled,
        pick: ({ neighbours }) => neighbours,
      });

      const linked = reads.filter(({ previous, next }) => previous || next);
      expect(linked).not.toHaveLength(0);
      linked.forEach((links) =>
        expect([within, settled]).toContainEqual(links)
      );
    });

    it("should build no link from the left params' adjacent lists when the season's episodes are read first", async () => {
      serveSeasonTwoEpisodes();
      const settled: Neighbours = {
        previous: '/shows/silo/seasons/2/episodes/9',
      };

      const reads = await readsAfterChange({
        from: SEASON_ONE_EPISODE_TEN,
        to: SEASON_TWO_EPISODE_TEN,
        settled,
        // Distinct, since combineLatest repeats the left links when the episodes emit first.
        pick: ({ episodes, neighbours }) =>
          combineLatest([episodes, neighbours]).pipe(
            map(([, links]) => links),
            distinctUntilChanged(isSameLinks),
          ),
      });

      const linked = reads.filter(({ previous, next }) => previous || next);
      expect(linked).not.toHaveLength(0);
      linked.forEach((links) => expect(links).toEqual(settled));
    });

    it("should read no season list from the left show's seasons once the params name another", async () => {
      serveDevsSeasonOne();

      const requests = await captureRequests(() =>
        readsAfterChange({
          to: DEVS_EPISODE_EIGHT,
          settled: DEVS_EPISODE_EIGHT_LINKS,
          pick: ({ neighbours }) => neighbours,
        })
      );

      expect(requests.filter((request) => request.includes('/devs/seasons')))
        .toEqual(['GET /shows/devs/seasons', 'GET /shows/devs/seasons/1']);
    });

    it.each([
      [
        "season's episodes",
        SEASON_TWO_EPISODE_SEVEN,
        SEASON_TWO_EPISODE_SEVEN_LINKS,
        serveShorterSeasonOne,
      ],
      [
        "show's lists",
        DEVS_EPISODE_EIGHT,
        DEVS_EPISODE_EIGHT_LINKS,
        serveDevsSeasonOne,
      ],
    ])(
      'should build no links from the left %s once the params name others',
      async (_, to, settled, serve) => {
        serve();

        const reads = await readsAfterChange({
          to,
          settled,
          pick: ({ neighbours }) => neighbours,
        });

        const linked = reads.filter(({ previous, next }) => previous || next);
        expect(linked).not.toHaveLength(0);
        linked.forEach((links) => expect(links).toEqual(settled));
      },
    );
  });
});
