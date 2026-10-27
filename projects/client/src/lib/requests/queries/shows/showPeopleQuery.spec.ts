import { SILO_PEOPLE_URL } from '$mocks/data/shows/SILO_PEOPLE_URL.ts';
import { ShowSiloPeopleMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloPeopleMappedMock.ts';
import { ShowSiloPeopleResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloPeopleResponseMock.ts';
import { ShowSiloResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloResponseMock.ts';
import { server } from '$mocks/server.ts';
import { createTestBedQuery } from '$test/beds/query/createTestBedQuery.ts';
import { describePeopleQuery } from '$test/beds/query/describePeopleQuery.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { showPeopleQuery } from './showPeopleQuery.ts';

describePeopleQuery({
  name: 'showPeopleQuery',
  subject: 'Silo (2023)',
  query: () => showPeopleQuery({ slug: ShowSiloResponseMock.ids.slug }),
  url: SILO_PEOPLE_URL,
  response: ShowSiloPeopleResponseMock,
  mapped: ShowSiloPeopleMappedMock,
});

describe('showPeopleQuery', () => {
  it('should encode the slug into the path', async () => {
    const paths: Array<string> = [];
    server.use(
      http.get('http://localhost/shows/*', ({ request }) => {
        paths.push(new URL(request.url).pathname);
        return HttpResponse.json(ShowSiloPeopleResponseMock);
      }),
    );

    await runQuery({
      factory: () => createTestBedQuery(showPeopleQuery({ slug: 'silo/2023' })),
      mapper: (response) => response?.data,
    });

    expect(paths).toEqual(['/shows/silo%2F2023/people']);
  });
});
