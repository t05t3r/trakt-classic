import { MovieHereticCommentsMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticCommentsMappedMock.ts';
import { MovieHereticCommentsResponseMock } from '$mocks/data/summary/movies/heretic/response/MovieHereticCommentsResponseMock.ts';
import { MovieHereticMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticMappedMock.ts';
import { createTestBedInfiniteQuery } from '$test/beds/query/createTestBedInfiniteQuery.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { recordSearches } from '$test/beds/request/recordSearches.ts';
import { mapToEntries } from '$test/utils/mapToEntries.ts';
import { describe, expect, it } from 'vitest';
import { movieCommentsQuery } from './movieCommentsQuery.ts';

describe('movieCommentsQuery', () => {
  it('should query for comments on a movie', async () => {
    const result = await runQuery({
      factory: () =>
        createTestBedInfiniteQuery(
          movieCommentsQuery({
            slug: MovieHereticMappedMock.slug,
            limit: 10,
            sort: 'likes',
          }),
        ),
      mapper: mapToEntries,
    });

    expect(result).to.deep.equal(MovieHereticCommentsMappedMock);
  });

  it('should forward the language filter to the request', async () => {
    const searches = recordSearches(
      `http://localhost/movies/${MovieHereticMappedMock.slug}/comments/likes`,
      MovieHereticCommentsResponseMock,
    );

    await runQuery({
      factory: () =>
        createTestBedInfiniteQuery(
          movieCommentsQuery({
            slug: MovieHereticMappedMock.slug,
            limit: 10,
            sort: 'likes',
            language: 'fr',
          }),
        ),
      mapper: mapToEntries,
    });

    expect(searches.at(-1)?.get('language')).to.equal('fr');
  });
});
