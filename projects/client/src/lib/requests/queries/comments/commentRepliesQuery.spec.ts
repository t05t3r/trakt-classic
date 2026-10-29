import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { SILO_EPISODE_COMMENT_REPLIES_URL } from '$mocks/data/shows/SILO_EPISODE_COMMENT_REPLIES_URL.ts';
import { EpisodeSiloCommentReplyMappedMock } from '$mocks/data/summary/episodes/silo/mapped/EpisodeSiloCommentReplyMappedMock.ts';
import { EpisodeSiloCommentsMappedMock } from '$mocks/data/summary/episodes/silo/mapped/EpisodeSiloCommentsMappedMock.ts';
import { EpisodeSiloCommentReplyResponseMock } from '$mocks/data/summary/episodes/silo/response/EpisodeSiloCommentReplyResponseMock.ts';
import { describeCommentsQuery } from '$test/beds/query/describeCommentsQuery.ts';
import { commentRepliesQuery } from './commentRepliesQuery.ts';

describeCommentsQuery({
  name: 'commentRepliesQuery',
  subject: 'a comment',
  query: () =>
    commentRepliesQuery({
      id: assertDefined(EpisodeSiloCommentsMappedMock.at(0)).id,
      limit: 10,
    }),
  url: SILO_EPISODE_COMMENT_REPLIES_URL,
  response: EpisodeSiloCommentReplyResponseMock,
  mapped: EpisodeSiloCommentReplyMappedMock,
});
