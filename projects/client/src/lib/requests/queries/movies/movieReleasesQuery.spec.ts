import { HERETIC_RELEASES_URL } from '$mocks/data/movies/HERETIC_RELEASES_URL.ts';
import { MovieHereticReleasesResponseMock } from '$mocks/data/summary/movies/heretic/response/MovieHereticReleasesResponseMock.ts';
import { MovieHereticReleasesMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticReleasesMappedMock.ts';
import { MovieHereticMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticMappedMock.ts';
import { server } from '$mocks/server.ts';
import { createTestBedQuery } from '$test/beds/query/createTestBedQuery.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { time } from '$lib/utils/timing/time.ts';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { movieReleasesQuery } from './movieReleasesQuery.ts';

function serveReleases(body: ReadonlyArray<unknown>) {
  server.use(http.get(HERETIC_RELEASES_URL, () => HttpResponse.json(body)));
}

const readReleases = () =>
  runQuery({
    factory: () =>
      createTestBedQuery(
        movieReleasesQuery({ slug: MovieHereticMappedMock.slug }),
      ),
    waitFor: (result) => result?.isSuccess === true,
  });

describe('movieReleasesQuery', () => {
  it('should read the earliest release date of every country', async () => {
    const result = await readReleases();

    expect(result.data).toEqual(MovieHereticReleasesMappedMock);
  });

  it('should ask for the releases of every country', async () => {
    const urls: URL[] = [];
    server.use(
      http.get(`${HERETIC_RELEASES_URL}*`, ({ request }) => {
        urls.push(new URL(request.url));
        return HttpResponse.json(MovieHereticReleasesResponseMock);
      }),
    );

    await readReleases();

    expect(urls.map((url) => url.href)).toEqual([HERETIC_RELEASES_URL]);
  });

  it('should read the earliest release of rows out of date order', async () => {
    serveReleases(MovieHereticReleasesResponseMock.toReversed());

    const result = await readReleases();

    expect(result.data).toEqual(MovieHereticReleasesMappedMock);
  });

  it('should read null for a movie with no releases', async () => {
    serveReleases([]);

    const result = await readReleases();

    expect(result.data).toBeNull();
  });

  it('should keep its data fresh for 12 hours', () => {
    expect(movieReleasesQuery({ slug: MovieHereticMappedMock.slug }).staleTime)
      .toBe(time.hours(12));
  });
});
