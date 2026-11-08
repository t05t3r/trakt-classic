import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { MovieHereticCommentsResponseMock } from '$mocks/data/summary/movies/heretic/response/MovieHereticCommentsResponseMock.ts';
import { MovieHereticResponseMock } from '$mocks/data/summary/movies/heretic/response/MovieHereticResponseMock.ts';
import { SeasonSiloResponseMock } from '$mocks/data/summary/seasons/silo/response/SeasonSiloResponseMock.ts';
import { ShowSiloResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloResponseMock.ts';
import { server } from '$mocks/server.ts';
import { createTestBedQuery } from '$test/beds/query/createTestBedQuery.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { commentItemQuery } from './commentItemQuery.ts';

describe('commentItemQuery', () => {
  it('should map the attached movie to a direct comment target', async () => {
    const comment = assertDefined(MovieHereticCommentsResponseMock.at(0));
    const result = await runQuery({
      factory: () => createTestBedQuery(commentItemQuery({ id: comment.id })),
      mapper: (response) => response?.data,
    });

    expect(result).to.deep.equal({
      type: 'movie',
      slug: MovieHereticResponseMock.ids.slug,
    });
  });

  it('should map a season with a null air date to a direct comment target', async () => {
    const id = 1;
    server.use(
      http.get(
        `http://localhost/comments/${id}/item`,
        () =>
          HttpResponse.json({
            type: 'season',
            show: ShowSiloResponseMock,
            season: { ...SeasonSiloResponseMock, first_aired: null },
          }),
      ),
    );

    const result = await runQuery({
      factory: () => createTestBedQuery(commentItemQuery({ id })),
      mapper: (response) => response?.data,
    });

    expect(result).to.deep.equal({
      type: 'season',
      slug: ShowSiloResponseMock.ids.slug,
      season: SeasonSiloResponseMock.number,
    });
  });
});
