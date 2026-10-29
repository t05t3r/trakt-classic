import { SILO_SEASON_COMMENTS_URL } from '$mocks/data/shows/SILO_SEASON_COMMENTS_URL.ts';
import { SILO_SEASON_PARAMS } from '$mocks/data/shows/SILO_SEASON_PARAMS.ts';
import { ShowSiloCommentsMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloCommentsMappedMock.ts';
import { ShowSiloCommentsResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloCommentsResponseMock.ts';
import { describeCommentsQuery } from '$test/beds/query/describeCommentsQuery.ts';
import { showSeasonCommentsQuery } from './showSeasonCommentsQuery.ts';

describeCommentsQuery({
  name: 'showSeasonCommentsQuery',
  subject: 'a season',
  query: () =>
    showSeasonCommentsQuery({
      ...SILO_SEASON_PARAMS,
      limit: 10,
      sort: 'likes',
    }),
  url: `${SILO_SEASON_COMMENTS_URL}/likes`,
  response: ShowSiloCommentsResponseMock,
  mapped: ShowSiloCommentsMappedMock,
});
