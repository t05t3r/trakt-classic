import { http, HttpResponse } from 'msw';
import { pageHeaders } from '$mocks/pageHeaders.ts';

import { OfficialListsResponseMock } from '$mocks/data/lists/response/OfficialListsResponseMock.ts';
import { EpisodeSiloCommentsResponseMock } from '$mocks/data/summary/episodes/silo/response/EpisodeSiloCommentsResponseMock.ts';
import { EpisodeSiloPeopleResponseMock } from '$mocks/data/summary/episodes/silo/response/EpisodeSiloPeopleResponseMock.ts';
import { EpisodeSiloWatchNowResponseMock } from '$mocks/data/summary/episodes/silo/response/EpisodeSiloWatchNowResponseMock.ts';
import { ShowSiloCommentsResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloCommentsResponseMock.ts';
import { SILO_COMMENTS_URL } from '$mocks/data/shows/SILO_COMMENTS_URL.ts';
import { SILO_EPISODE_COMMENTS_URL } from '$mocks/data/shows/SILO_EPISODE_COMMENTS_URL.ts';
import { SILO_SEASON_COMMENTS_URL } from '$mocks/data/shows/SILO_SEASON_COMMENTS_URL.ts';
import { SILO_EPISODE_OFFICIAL_LISTS_URL } from '$mocks/data/shows/SILO_EPISODE_OFFICIAL_LISTS_URL.ts';
import { SILO_EPISODE_PERSONAL_LISTS_URL } from '$mocks/data/shows/SILO_EPISODE_PERSONAL_LISTS_URL.ts';
import { SILO_LAST_EPISODE_URL } from '$mocks/data/shows/SILO_LAST_EPISODE_URL.ts';
import { SILO_PROGRESS_URL } from '$mocks/data/shows/SILO_PROGRESS_URL.ts';
import { SILO_SEASON_OFFICIAL_LISTS_URL } from '$mocks/data/shows/SILO_SEASON_OFFICIAL_LISTS_URL.ts';
import { SILO_SEASON_ONE_EPISODES_URL } from '$mocks/data/shows/SILO_SEASON_ONE_EPISODES_URL.ts';
import { SILO_SEASON_PERSONAL_LISTS_URL } from '$mocks/data/shows/SILO_SEASON_PERSONAL_LISTS_URL.ts';
import { SILO_SEASON_TWO_EPISODES_URL } from '$mocks/data/shows/SILO_SEASON_TWO_EPISODES_URL.ts';
import { SILO_SEASONS_URL } from '$mocks/data/shows/SILO_SEASONS_URL.ts';
import { SILO_MISSING_SEASON } from '$mocks/data/shows/SILO_MISSING_SEASON.ts';
import { SILO_SEASON_STATS_URL } from '$mocks/data/shows/SILO_SEASON_STATS_URL.ts';
import { SILO_SEASON_SUMMARY_URL } from '$mocks/data/shows/SILO_SEASON_SUMMARY_URL.ts';
import { ShowsAnticipatedResponseMock } from '$mocks/data/shows/response/ShowsAnticipatedResponseMock.ts';
import { ShowsPopularResponseMock } from '$mocks/data/shows/response/ShowsPopularResponseMock.ts';
import { ShowsTrendingResponseMock } from '$mocks/data/shows/response/ShowsTrendingResponseMock.ts';
import { SeasonSiloResponseMock } from '$mocks/data/summary/seasons/silo/response/SeasonSiloResponseMock.ts';
import { SeasonSiloStatsResponseMock } from '$mocks/data/summary/seasons/silo/response/SeasonSiloStatsResponseMock.ts';
import { MediaWatchingResponseMock } from '$mocks/data/summary/common/response/MediaWatchingResponseMock.ts';
import { EpisodeSiloRatingsResponseMock } from '$mocks/data/summary/episodes/silo/response/EpisodeSiloRatingsResponseMock.ts';
import { EpisodeSiloResponseMock } from '$mocks/data/summary/episodes/silo/response/EpisodeSiloResponseMock.ts';
import { EpisodeSiloStatsResponseMock } from '$mocks/data/summary/episodes/silo/response/EpisodeSiloStatsResponseMock.ts';
import { EpisodeSiloTranslationsResponseMock } from '$mocks/data/summary/episodes/silo/response/EpisodeSiloTranslationsResponseMock.ts';
import { ShowSiloLastEpisodeResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloLastEpisodeResponseMock.ts';
import { ShowSiloPeopleResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloPeopleResponseMock.ts';
import { ShowSiloProgressResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloProgressResponseMock.ts';
import { ShowSiloRatingsResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloRatingsResponseMock.ts';
import { ShowSiloRelatedResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloRelatedResponseMock.ts';
import { ShowSiloResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloResponseMock.ts';
import { ShowSiloSeasonTwoEpisodesResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloSeasonTwoEpisodesResponseMock.ts';
import { ShowSiloSeasonEpisodesResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloSeasonEpisodesResponseMock.ts';
import { ShowSiloSeasonsResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloSeasonsResponseMock.ts';
import { ShowSiloStatsResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloStatsResponseMock.ts';
import { ShowSiloStudiosResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloStudiosResponseMock.ts';
import { ShowSiloTranslationsResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloTranslationsResponseMock.ts';
import { ShowSiloVideoResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloVideoResponseMock.ts';
import { ShowSiloVideoSeason1ResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloVideoSeason1ResponseMock.ts';
import { ShowSiloVideoSeason2ResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloVideoSeason2ResponseMock.ts';
import { ShowSiloWatchNowResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloWatchNowResponseMock.ts';
import { SiloListsResponseMock } from '$mocks/data/summary/shows/silo/response/SiloListsResponseMock.ts';

export const shows = [
  http.get(
    `http://localhost/shows/${ShowSiloResponseMock.ids.slug}`,
    () => {
      return HttpResponse.json(ShowSiloResponseMock);
    },
  ),
  http.get(
    `http://localhost/shows/${ShowSiloResponseMock.ids.slug}/translations/en`,
    () => {
      return HttpResponse.json(
        ShowSiloTranslationsResponseMock.get('en'),
      );
    },
  ),
  http.get(
    `http://localhost/shows/${ShowSiloResponseMock.ids.slug}/translations/nl`,
    () => {
      return HttpResponse.json(
        ShowSiloTranslationsResponseMock.get('nl'),
      );
    },
  ),
  http.get(
    `http://localhost/shows/${ShowSiloResponseMock.ids.slug}/translations/ja`,
    () => {
      return HttpResponse.json(
        ShowSiloTranslationsResponseMock.get('ja'),
      );
    },
  ),
  http.get(
    `http://localhost/shows/${ShowSiloResponseMock.ids.slug}/ratings`,
    () => {
      return HttpResponse.json(ShowSiloRatingsResponseMock);
    },
  ),
  http.get(
    `http://localhost/shows/${ShowSiloResponseMock.ids.slug}/stats`,
    () => {
      return HttpResponse.json(ShowSiloStatsResponseMock);
    },
  ),
  http.get(
    `http://localhost/shows/${ShowSiloResponseMock.ids.slug}/watching`,
    () => {
      return HttpResponse.json(MediaWatchingResponseMock);
    },
  ),
  http.get(
    `http://localhost/shows/${ShowSiloResponseMock.ids.slug}/studios`,
    () => {
      return HttpResponse.json(ShowSiloStudiosResponseMock);
    },
  ),
  http.get(
    `http://localhost/shows/${ShowSiloResponseMock.ids.slug}/people`,
    () => {
      return HttpResponse.json(ShowSiloPeopleResponseMock);
    },
  ),
  http.get(
    SILO_PROGRESS_URL,
    () => {
      return HttpResponse.json(ShowSiloProgressResponseMock);
    },
  ),
  http.get(
    SILO_LAST_EPISODE_URL,
    () => {
      return HttpResponse.json(ShowSiloLastEpisodeResponseMock);
    },
  ),
  http.post(
    'http://localhost/shows/:id/progress/watched/reset',
    () => {
      return new HttpResponse(null, {
        status: 204,
      });
    },
  ),
  http.delete(
    'http://localhost/shows/:id/progress/watched/reset',
    () => {
      return new HttpResponse(null, {
        status: 204,
      });
    },
  ),
  http.get(
    SILO_SEASONS_URL,
    () => {
      return HttpResponse.json(ShowSiloSeasonsResponseMock);
    },
  ),
  http.get(
    SILO_SEASON_SUMMARY_URL,
    () => {
      return HttpResponse.json(SeasonSiloResponseMock);
    },
  ),
  http.get(
    `http://localhost/shows/${ShowSiloResponseMock.ids.slug}/seasons/${SILO_MISSING_SEASON}/info`,
    () => {
      return new HttpResponse(null, { status: 204 });
    },
  ),
  http.get(
    SILO_SEASON_STATS_URL,
    () => {
      return HttpResponse.json(SeasonSiloStatsResponseMock);
    },
  ),
  http.get(
    `http://localhost/shows/${ShowSiloResponseMock.ids.slug}/watchnow/*`,
    () => {
      return HttpResponse.json(ShowSiloWatchNowResponseMock);
    },
  ),
  http.get(
    `http://localhost/shows/${ShowSiloResponseMock.ids.slug}/seasons/${EpisodeSiloResponseMock.season}/episodes/${EpisodeSiloResponseMock.number}/watching`,
    () => {
      return HttpResponse.json(MediaWatchingResponseMock);
    },
  ),
  http.get(
    `http://localhost/shows/${ShowSiloResponseMock.ids.slug}/seasons/${EpisodeSiloResponseMock.season}/episodes/${EpisodeSiloResponseMock.number}/stats`,
    () => {
      return HttpResponse.json(EpisodeSiloStatsResponseMock);
    },
  ),
  http.get(
    `http://localhost/shows/${ShowSiloResponseMock.ids.slug}/seasons/${EpisodeSiloResponseMock.season}/episodes/${EpisodeSiloResponseMock.number}/ratings`,
    () => {
      return HttpResponse.json(EpisodeSiloRatingsResponseMock);
    },
  ),
  http.get(
    `http://localhost/shows/${ShowSiloResponseMock.ids.slug}/seasons/${EpisodeSiloResponseMock.season}/episodes/${EpisodeSiloResponseMock.number}/translations/en`,
    () => {
      return HttpResponse.json(EpisodeSiloTranslationsResponseMock.get('en'));
    },
  ),
  http.get(
    `http://localhost/shows/${ShowSiloResponseMock.ids.slug}/seasons/${EpisodeSiloResponseMock.season}/episodes/${EpisodeSiloResponseMock.number}/translations/nl`,
    () => {
      return HttpResponse.json(EpisodeSiloTranslationsResponseMock.get('nl'));
    },
  ),
  http.get(
    `${SILO_SEASON_COMMENTS_URL}/:sort`,
    () =>
      HttpResponse.json(ShowSiloCommentsResponseMock, {
        headers: pageHeaders(),
      }),
  ),
  http.get(
    `http://localhost/shows/${ShowSiloResponseMock.ids.slug}/seasons/${EpisodeSiloResponseMock.season}/people`,
    () => {
      return HttpResponse.json(ShowSiloPeopleResponseMock);
    },
  ),
  http.get(
    `${SILO_EPISODE_COMMENTS_URL}/:sort`,
    () =>
      HttpResponse.json(EpisodeSiloCommentsResponseMock, {
        headers: pageHeaders(),
      }),
  ),
  http.get(
    `http://localhost/shows/${ShowSiloResponseMock.ids.slug}/seasons/${EpisodeSiloResponseMock.season}/episodes/${EpisodeSiloResponseMock.number}/people`,
    () => {
      return HttpResponse.json(EpisodeSiloPeopleResponseMock);
    },
  ),
  http.get(
    `http://localhost/shows/${ShowSiloResponseMock.ids.slug}/seasons/${EpisodeSiloResponseMock.season}/episodes/${EpisodeSiloResponseMock.number}/watchnow/*`,
    () => {
      return HttpResponse.json(EpisodeSiloWatchNowResponseMock);
    },
  ),
  http.get(
    `${SILO_SEASON_PERSONAL_LISTS_URL}*`,
    () => {
      return HttpResponse.json(SiloListsResponseMock);
    },
  ),
  http.get(
    `${SILO_SEASON_OFFICIAL_LISTS_URL}*`,
    () => {
      return HttpResponse.json(OfficialListsResponseMock);
    },
  ),
  http.get(
    `${SILO_EPISODE_PERSONAL_LISTS_URL}*`,
    () => {
      return HttpResponse.json(SiloListsResponseMock);
    },
  ),
  http.get(
    `${SILO_EPISODE_OFFICIAL_LISTS_URL}*`,
    () => {
      return HttpResponse.json(OfficialListsResponseMock);
    },
  ),
  http.get(
    `http://localhost/shows/${ShowSiloResponseMock.ids.slug}/seasons/${EpisodeSiloResponseMock.season}/episodes/${EpisodeSiloResponseMock.number}*`,
    () => {
      return HttpResponse.json(EpisodeSiloResponseMock);
    },
  ),
  http.get(
    SILO_SEASON_ONE_EPISODES_URL,
    () => {
      return HttpResponse.json(ShowSiloSeasonEpisodesResponseMock);
    },
  ),
  http.get(
    SILO_SEASON_TWO_EPISODES_URL,
    () => {
      return HttpResponse.json(ShowSiloSeasonTwoEpisodesResponseMock);
    },
  ),
  http.get(
    'http://localhost/shows/trending*',
    () => {
      return HttpResponse.json(ShowsTrendingResponseMock);
    },
  ),
  http.get(
    'http://localhost/shows/popular*',
    () => {
      return HttpResponse.json(ShowsPopularResponseMock);
    },
  ),
  http.get(
    'http://localhost/shows/anticipated*',
    () => {
      return HttpResponse.json(ShowsAnticipatedResponseMock);
    },
  ),
  http.get(
    `http://localhost/shows/${ShowSiloResponseMock.ids.slug}/related*`,
    () => {
      return HttpResponse.json(ShowSiloRelatedResponseMock);
    },
  ),
  http.get(
    `http://localhost/shows/${ShowSiloResponseMock.ids.slug}/lists/personal/popular*`,
    () => {
      return HttpResponse.json(SiloListsResponseMock);
    },
  ),
  http.get(
    `http://localhost/shows/${ShowSiloResponseMock.ids.slug}/lists/official/popular*`,
    () => {
      return HttpResponse.json(OfficialListsResponseMock);
    },
  ),
  http.get(
    `${SILO_COMMENTS_URL}/:sort`,
    () =>
      HttpResponse.json(ShowSiloCommentsResponseMock, {
        headers: pageHeaders(),
      }),
  ),
  http.get(
    `http://localhost/shows/${ShowSiloResponseMock.ids.slug}/videos`,
    () => {
      return HttpResponse.json(ShowSiloVideoResponseMock);
    },
  ),
  http.get(
    `http://localhost/shows/${ShowSiloResponseMock.ids.slug}/seasons/all/videos`,
    () => {
      return HttpResponse.json([
        ...ShowSiloVideoSeason1ResponseMock,
        ...ShowSiloVideoSeason2ResponseMock,
      ]);
    },
  ),
];
