import { HERETIC_COMMENTS_URL } from '$mocks/data/movies/HERETIC_COMMENTS_URL.ts';
import { MovieHereticCommentsMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticCommentsMappedMock.ts';
import { MovieHereticCommentsResponseMock } from '$mocks/data/summary/movies/heretic/response/MovieHereticCommentsResponseMock.ts';
import { MovieHereticMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticMappedMock.ts';
import { createTestBedInfiniteQuery } from '$test/beds/query/createTestBedInfiniteQuery.ts';
import { describeCommentsQuery } from '$test/beds/query/describeCommentsQuery.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { recordSearches } from '$test/beds/request/recordSearches.ts';
import { mapToEntries } from '$test/utils/mapToEntries.ts';
import { describe, expect, it } from 'vitest';
import { movieCommentsQuery } from './movieCommentsQuery.ts';

const PARAMS = {
  slug: MovieHereticMappedMock.slug,
  limit: 10,
  sort: 'likes',
} as const;

describeCommentsQuery({
  name: 'movieCommentsQuery',
  subject: 'a movie',
  query: () => movieCommentsQuery(PARAMS),
  url: `${HERETIC_COMMENTS_URL}/likes`,
  response: MovieHereticCommentsResponseMock,
  mapped: MovieHereticCommentsMappedMock,
});

describe('movieCommentsQuery', () => {
  it('should forward the language filter to the request', async () => {
    const searches = recordSearches(
      `${HERETIC_COMMENTS_URL}/likes`,
      MovieHereticCommentsResponseMock,
    );

    await runQuery({
      factory: () =>
        createTestBedInfiniteQuery(
          movieCommentsQuery({ ...PARAMS, language: 'fr' }),
        ),
      mapper: mapToEntries,
    });

    expect(searches.at(-1)?.get('language')).to.equal('fr');
  });
});
