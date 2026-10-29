import { http, HttpResponse } from 'msw';

import { SILO_EPISODE_COMMENT_REPLIES_URL } from '$mocks/data/shows/SILO_EPISODE_COMMENT_REPLIES_URL.ts';
import { EpisodeSiloCommentReplyResponseMock } from '$mocks/data/summary/episodes/silo/response/EpisodeSiloCommentReplyResponseMock.ts';
import { EpisodeSiloCommentsResponseMock } from '$mocks/data/summary/episodes/silo/response/EpisodeSiloCommentsResponseMock.ts';
import { MovieHereticCommentsResponseMock } from '$mocks/data/summary/movies/heretic/response/MovieHereticCommentsResponseMock.ts';
import { MovieHereticResponseMock } from '$mocks/data/summary/movies/heretic/response/MovieHereticResponseMock.ts';
import { EpisodeSiloCommentReactionsResponseMock } from '$mocks/data/summary/episodes/silo/response/EpisodeSiloCommentReactionsResponseMock.ts';

const commentResponseMocks = [
  ...EpisodeSiloCommentsResponseMock,
  ...EpisodeSiloCommentReplyResponseMock,
  ...MovieHereticCommentsResponseMock,
];

export const comments = [
  http.get(
    'http://localhost/comments/:id/item',
    ({ params }) => {
      const id = Number(params.id);
      const hasComment = MovieHereticCommentsResponseMock.some((comment) =>
        comment.id === id
      );

      if (!hasComment) {
        return HttpResponse.json(null, { status: 404 });
      }

      return HttpResponse.json({
        type: 'movie',
        movie: MovieHereticResponseMock,
      });
    },
  ),
  http.get(
    'http://localhost/comments/:id',
    ({ params }) => {
      const id = Number(params.id);
      const comment = commentResponseMocks.find((comment) => comment.id === id);

      if (comment == null) {
        return HttpResponse.json(null, { status: 404 });
      }

      return HttpResponse.json(comment);
    },
  ),
  http.get(
    SILO_EPISODE_COMMENT_REPLIES_URL,
    () => {
      return HttpResponse.json(EpisodeSiloCommentReplyResponseMock);
    },
  ),
  http.get(
    'http://localhost/comments/*/reactions/summary',
    () => {
      return HttpResponse.json(EpisodeSiloCommentReactionsResponseMock);
    },
  ),
];
