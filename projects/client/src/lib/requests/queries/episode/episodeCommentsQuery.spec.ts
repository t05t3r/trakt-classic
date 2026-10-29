import { SILO_EPISODE_COMMENTS_URL } from '$mocks/data/shows/SILO_EPISODE_COMMENTS_URL.ts';
import { SILO_EPISODE_PARAMS } from '$mocks/data/shows/SILO_EPISODE_PARAMS.ts';
import { EpisodeSiloCommentsMappedMock } from '$mocks/data/summary/episodes/silo/mapped/EpisodeSiloCommentsMappedMock.ts';
import { EpisodeSiloCommentsResponseMock } from '$mocks/data/summary/episodes/silo/response/EpisodeSiloCommentsResponseMock.ts';
import { describeCommentsQuery } from '$test/beds/query/describeCommentsQuery.ts';
import { episodeCommentsQuery } from './episodeCommentsQuery.ts';

describeCommentsQuery({
  name: 'episodeCommentsQuery',
  subject: 'an episode',
  query: () =>
    episodeCommentsQuery({
      ...SILO_EPISODE_PARAMS,
      limit: 10,
      sort: 'likes',
    }),
  url: `${SILO_EPISODE_COMMENTS_URL}/likes`,
  response: EpisodeSiloCommentsResponseMock,
  mapped: EpisodeSiloCommentsMappedMock,
});
