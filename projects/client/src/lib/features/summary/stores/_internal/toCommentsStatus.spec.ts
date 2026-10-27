import { episodeStatsQuery } from '$lib/requests/queries/episode/episodeStatsQuery.ts';
import { SILO_EPISODE_SUMMARY_URL } from '$mocks/data/shows/SILO_EPISODE_SUMMARY_URL.ts';
import { EpisodeSiloStatsMappedMock } from '$mocks/data/summary/episodes/silo/mapped/EpisodeSiloStatsMappedMock.ts';
import { EpisodeSiloResponseMock } from '$mocks/data/summary/episodes/silo/response/EpisodeSiloResponseMock.ts';
import { EpisodeSiloStatsResponseMock } from '$mocks/data/summary/episodes/silo/response/EpisodeSiloStatsResponseMock.ts';
import { ShowSiloResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloResponseMock.ts';
import { server } from '$mocks/server.ts';
import { createTestBedQuery } from '$test/beds/query/createTestBedQuery.ts';
import { nextOf } from '$test/beds/query/nextOf.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { http, HttpResponse } from 'msw';
import { map } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { toCommentsStatus } from './toCommentsStatus.ts';

const renderEpisodeComments = () =>
  renderStore(() =>
    createTestBedQuery(
      episodeStatsQuery({
        slug: ShowSiloResponseMock.ids.slug,
        season: EpisodeSiloResponseMock.season,
        episode: EpisodeSiloResponseMock.number,
      }),
    ).pipe(map(toCommentsStatus))
  );

describe('toCommentsStatus', () => {
  it("should read the comment count of an episode's stats", async () => {
    const status = await renderEpisodeComments();

    expect(await nextOf(status, 'ready')).toEqual({
      kind: 'ready',
      data: EpisodeSiloStatsMappedMock.comments,
    });
  });

  it('should read as empty when the episode has no comments', async () => {
    server.use(
      http.get(
        `${SILO_EPISODE_SUMMARY_URL}/stats`,
        () =>
          HttpResponse.json({ ...EpisodeSiloStatsResponseMock, comments: 0 }),
      ),
    );

    const status = await renderEpisodeComments();

    expect(await nextOf(status, 'empty')).toEqual({ kind: 'empty' });
  });
});
