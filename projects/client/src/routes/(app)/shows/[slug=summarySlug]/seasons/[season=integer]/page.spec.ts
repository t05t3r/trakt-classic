import { createQueryClient } from '$lib/features/query/createQueryClient.ts';
import { showSeasonSummaryQuery } from '$lib/requests/queries/shows/showSeasonSummaryQuery.ts';
import { showSummaryQuery } from '$lib/requests/queries/shows/showSummaryQuery.ts';
import { SILO_MISSING_SEASON } from '$mocks/data/shows/SILO_MISSING_SEASON.ts';
import { SILO_SEASON_SUMMARY_URL } from '$mocks/data/shows/SILO_SEASON_SUMMARY_URL.ts';
import { SILO_SUMMARY_URL } from '$mocks/data/shows/SILO_SUMMARY_URL.ts';
import { SeasonSiloMappedMock } from '$mocks/data/summary/seasons/silo/mapped/SeasonSiloMappedMock.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { server } from '$mocks/server.ts';
import { httpErrorStatus } from '$test/beds/request/httpErrorStatus.ts';
import { http, HttpResponse, type HttpResponseResolver } from 'msw';
import { describe, expect, it } from 'vitest';
import { load } from './+page.ts';

type LoadEvent = Parameters<typeof load>[0];

const SLUG = ShowSiloMappedMock.slug;
const SEASON = SeasonSiloMappedMock.number;

const runLoad = async (season = SEASON) => {
  const queryClient = createQueryClient({ retryDelay: 0 });
  const event = {
    params: { slug: SLUG, season: String(season) },
    parent: () => Promise.resolve({ queryClient }),
    fetch: globalThis.fetch,
  } as unknown as LoadEvent;

  await load(event);

  return queryClient;
};

const serveSummary = (answer: HttpResponseResolver) =>
  server.use(http.get(SILO_SEASON_SUMMARY_URL, answer));

describe('load: season summary', () => {
  it('should leave the season summary in the query cache for the page', async () => {
    const queryClient = await runLoad();

    expect(
      queryClient.getQueryData(
        showSeasonSummaryQuery({ slug: SLUG, season: SEASON }).queryKey,
      ),
    ).toEqual(SeasonSiloMappedMock);
  });

  it("should leave the show's summary in the query cache for the page", async () => {
    const queryClient = await runLoad();

    expect(queryClient.getQueryData(showSummaryQuery({ slug: SLUG }).queryKey))
      .toEqual(ShowSiloMappedMock);
  });

  it('should raise a 404 for a season the show does not have', async () => {
    expect(await httpErrorStatus(() => runLoad(SILO_MISSING_SEASON))).toBe(404);
  });

  it('should raise a 404 for a show the API does not know', async () => {
    server.use(
      http.get(SILO_SUMMARY_URL, () => new HttpResponse(null, { status: 404 })),
    );

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
