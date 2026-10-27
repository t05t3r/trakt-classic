import { movieSummaryQuery } from '$lib/requests/queries/movies/movieSummaryQuery.ts';
import { HERETIC_SUMMARY_URL } from '$mocks/data/movies/HERETIC_SUMMARY_URL.ts';
import { MovieHereticMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticMappedMock.ts';
import { server } from '$mocks/server.ts';
import { http, HttpResponse } from 'msw';
import { httpErrorStatus } from '$test/beds/request/httpErrorStatus.ts';
import { describe, expect, it } from 'vitest';
import { createQueryClient } from './createQueryClient.ts';
import { fetchPageQuery } from './fetchPageQuery.ts';

const QUERY = () => movieSummaryQuery({ slug: MovieHereticMappedMock.slug });

const failingWith = (status: number) =>
  server.use(
    http.get(HERETIC_SUMMARY_URL, () => new HttpResponse(null, { status })),
  );

describe('fetchPageQuery', () => {
  it('should leave the fetched data in the query cache', async () => {
    const queryClient = createQueryClient();

    await fetchPageQuery({ queryClient, query: QUERY() });

    expect(queryClient.getQueryData(QUERY().queryKey))
      .toEqual(MovieHereticMappedMock);
  });

  it.each([404, 401, 503])(
    'should raise the %d the request failed with',
    async (status) => {
      failingWith(status);
      const queryClient = createQueryClient({ retryDelay: 0 });

      expect(
        await httpErrorStatus(() =>
          fetchPageQuery({ queryClient, query: QUERY() })
        ),
      )
        .toBe(status);
    },
  );

  it('should raise a 500 for a failed status outside the error range', async () => {
    failingWith(202);
    const queryClient = createQueryClient({ retryDelay: 0 });

    expect(
      await httpErrorStatus(() =>
        fetchPageQuery({ queryClient, query: QUERY() })
      ),
    )
      .toBe(500);
  });

  it('should raise a 404 when the answer has no body', async () => {
    failingWith(204);
    const queryClient = createQueryClient({ retryDelay: 0 });

    expect(
      await httpErrorStatus(() =>
        fetchPageQuery({ queryClient, query: QUERY() })
      ),
    )
      .toBe(404);
  });

  it('should leave no answer without a body in the query cache', async () => {
    failingWith(204);
    const queryClient = createQueryClient({ retryDelay: 0 });

    await httpErrorStatus(() =>
      fetchPageQuery({ queryClient, query: QUERY() })
    );

    expect(queryClient.getQueryState(QUERY().queryKey)).toBeUndefined();
  });

  it('should raise a 500 when the request never got an answer', async () => {
    server.use(http.get(HERETIC_SUMMARY_URL, () => HttpResponse.error()));
    const queryClient = createQueryClient({ retryDelay: 0 });

    expect(
      await httpErrorStatus(() =>
        fetchPageQuery({ queryClient, query: QUERY() })
      ),
    )
      .toBe(500);
  });
});
