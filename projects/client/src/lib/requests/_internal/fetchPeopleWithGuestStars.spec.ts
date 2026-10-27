import { SPECIALS } from '$lib/utils/media/SPECIALS.ts';
import { SILO_PEOPLE_URL } from '$mocks/data/shows/SILO_PEOPLE_URL.ts';
import { SILO_SUMMARY_URL } from '$mocks/data/shows/SILO_SUMMARY_URL.ts';
import { ShowSiloPeopleResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloPeopleResponseMock.ts';
import { ShowSiloResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloResponseMock.ts';
import { server } from '$mocks/server.ts';
import { notFound } from '$test/beds/request/notFound.ts';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { fetchPeopleWithGuestStars } from './fetchPeopleWithGuestStars.ts';

describe('fetchPeopleWithGuestStars', () => {
  it('should keep the specials in the path', async () => {
    const paths: Array<string> = [];
    server.use(
      http.get(`${SILO_SUMMARY_URL}/*`, ({ request }) => {
        paths.push(new URL(request.url).pathname);
        return HttpResponse.json(ShowSiloPeopleResponseMock);
      }),
    );

    await fetchPeopleWithGuestStars({
      slug: ShowSiloResponseMock.ids.slug,
      season: SPECIALS,
      episode: 1,
    });

    expect(paths).toEqual(['/shows/silo/seasons/0/episodes/1/people']);
  });

  it('should answer a failed request with its status and no body', async () => {
    server.use(http.get(SILO_PEOPLE_URL, notFound));

    const response = await fetchPeopleWithGuestStars({
      slug: ShowSiloResponseMock.ids.slug,
    });

    expect(response).toEqual({ body: undefined, status: 404 });
  });
});
