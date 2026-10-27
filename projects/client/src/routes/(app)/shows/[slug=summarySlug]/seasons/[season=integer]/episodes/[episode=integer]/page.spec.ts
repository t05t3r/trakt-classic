import { createQueryClient } from '$lib/features/query/createQueryClient.ts';
import { episodeSummaryQuery } from '$lib/requests/queries/episode/episodeSummaryQuery.ts';
import { showSummaryQuery } from '$lib/requests/queries/shows/showSummaryQuery.ts';
import { SILO_EPISODE_SUMMARY_URL } from '$mocks/data/shows/SILO_EPISODE_SUMMARY_URL.ts';
import { SILO_SEASONS_URL } from '$mocks/data/shows/SILO_SEASONS_URL.ts';
import { EpisodeSiloMappedMock } from '$mocks/data/summary/episodes/silo/mapped/EpisodeSiloMappedMock.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { server } from '$mocks/server.ts';
import { httpErrorStatus } from '$test/beds/request/httpErrorStatus.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { http, HttpResponse, type HttpResponseResolver } from 'msw';
import { describe, expect, it } from 'vitest';
import { load } from './+page.ts';

type LoadEvent = Parameters<typeof load>[0];

const SLUG = ShowSiloMappedMock.slug;
const SEASON = EpisodeSiloMappedMock.season;
const EPISODE = EpisodeSiloMappedMock.number;

const runLoad = async () => {
  const queryClient = createQueryClient({ retryDelay: 0 });
  const event = {
    params: { slug: SLUG, season: String(SEASON), episode: String(EPISODE) },
    parent: () => Promise.resolve({ queryClient }),
    fetch: globalThis.fetch,
  } as unknown as LoadEvent;

  await load(event);

  return queryClient;
};

const serveSummary = (answer: HttpResponseResolver) =>
  server.use(http.get(SILO_EPISODE_SUMMARY_URL, answer));

describe('load: episode summary', () => {
  it('should leave the episode summary in the query cache for the page', async () => {
    const queryClient = await runLoad();

    expect(
      queryClient.getQueryData(
        episodeSummaryQuery({ slug: SLUG, season: SEASON, episode: EPISODE })
          .queryKey,
      ),
    ).toEqual(EpisodeSiloMappedMock);
  });

  it("should leave the show's summary in the query cache for the page", async () => {
    const queryClient = await runLoad();

    expect(queryClient.getQueryData(showSummaryQuery({ slug: SLUG }).queryKey))
      .toEqual(ShowSiloMappedMock);
  });

  it('should not wait for the seasons', async () => {
    holdRequest({ method: 'get', url: SILO_SEASONS_URL });

    const queryClient = await runLoad();

    expect(queryClient.getQueryData(showSummaryQuery({ slug: SLUG }).queryKey))
      .toEqual(ShowSiloMappedMock);
  });

  it('should raise a 404 for an episode the API does not know', async () => {
    serveSummary(() => new HttpResponse(null, { status: 404 }));

    expect(await httpErrorStatus(runLoad)).toBe(404);
  });

  it('should raise the status of any other failed answer', async () => {
    serveSummary(() => new HttpResponse(null, { status: 500 }));

    expect(await httpErrorStatus(runLoad)).toBe(500);
  });

  it('should raise a 500 when the request never got an answer', async () => {
    serveSummary(() => HttpResponse.error());

    expect(await httpErrorStatus(runLoad)).toBe(500);
  });
});
