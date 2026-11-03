import { showSummaryQuery } from '$lib/requests/queries/shows/showSummaryQuery.ts';
import { SILO_SUMMARY_URL } from '$mocks/data/shows/SILO_SUMMARY_URL.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { server } from '$mocks/server.ts';
import { http, HttpResponse, type HttpResponseResolver } from 'msw';
import { httpErrorStatus } from '$test/beds/request/httpErrorStatus.ts';
import { mockLoadEvent } from '$test/beds/request/mockLoadEvent.ts';
import { describe, expect, it } from 'vitest';
import { load } from './+page.ts';

const SLUG = ShowSiloMappedMock.slug;

const runLoad = async () => {
  const { event, queryClient } = mockLoadEvent({
    load,
    params: { slug: SLUG },
  });

  await load(event);

  return queryClient;
};

const serveSummary = (answer: HttpResponseResolver) =>
  server.use(http.get(SILO_SUMMARY_URL, answer));

describe('load: show summary', () => {
  it('should leave the summary in the query cache for the page', async () => {
    const queryClient = await runLoad();

    expect(queryClient.getQueryData(showSummaryQuery({ slug: SLUG }).queryKey))
      .toEqual(ShowSiloMappedMock);
  });

  it('should raise a 404 for a slug the API does not know', async () => {
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
