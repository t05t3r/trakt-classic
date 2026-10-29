import { SILO_COMMENTS_URL } from '$mocks/data/shows/SILO_COMMENTS_URL.ts';
import { ShowSiloCommentsMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloCommentsMappedMock.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { ShowSiloCommentsResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloCommentsResponseMock.ts';
import { describeCommentsQuery } from '$test/beds/query/describeCommentsQuery.ts';
import { showCommentsQuery } from './showCommentsQuery.ts';

describeCommentsQuery({
  name: 'showCommentsQuery',
  subject: 'a show',
  query: () =>
    showCommentsQuery({
      slug: ShowSiloMappedMock.slug,
      limit: 10,
      sort: 'likes',
    }),
  url: `${SILO_COMMENTS_URL}/likes`,
  response: ShowSiloCommentsResponseMock,
  mapped: ShowSiloCommentsMappedMock,
});
