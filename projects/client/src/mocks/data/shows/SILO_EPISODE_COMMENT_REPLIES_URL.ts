import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { EpisodeSiloCommentsResponseMock } from '$mocks/data/summary/episodes/silo/response/EpisodeSiloCommentsResponseMock.ts';

export const SILO_EPISODE_COMMENT_REPLIES_URL = `http://localhost/comments/${
  assertDefined(EpisodeSiloCommentsResponseMock.at(0)).id
}/replies`;
