import { movieSummaryQuery } from '$lib/requests/queries/movies/movieSummaryQuery.ts';
import { HERETIC_SUMMARY_URL } from '$mocks/data/movies/HERETIC_SUMMARY_URL.ts';
import { MovieHereticMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticMappedMock.ts';
import { server } from '$mocks/server.ts';
import { http, HttpResponse, type HttpResponseResolver } from 'msw';
import { httpErrorStatus } from '$test/beds/request/httpErrorStatus.ts';
import { mockLoadEvent } from '$test/beds/request/mockLoadEvent.ts';
import { describe, expect, it } from 'vitest';
import { load } from './+page.ts';

const SLUG = MovieHereticMappedMock.slug;

const runLoad = async () => {
  const { event, queryClient } = mockLoadEvent({
    load,
    params: { slug: SLUG },
  });

  await load(event);

  return queryClient;
};

const serveSummary = (answer: HttpResponseResolver) =>
  server.use(http.get(HERETIC_SUMMARY_URL, answer));

describe('load: movie summary', () => {
  it('should leave the summary in the query cache for the page', async () => {
    const queryClient = await runLoad();

    expect(queryClient.getQueryData(movieSummaryQuery({ slug: SLUG }).queryKey))
      .toEqual(MovieHereticMappedMock);
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
