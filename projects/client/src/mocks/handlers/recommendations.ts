import { http, HttpResponse } from 'msw';

import { RecommendedMoviesResponseMock } from '$mocks/data/recommendations/response/RecommendedMoviesResponseMock.ts';
import { RecommendedShowsResponseMock } from '$mocks/data/recommendations/response/RecommendedShowsResponseMock.ts';
import { RECOMMENDED_MOVIES_URL } from '$mocks/data/recommendations/RECOMMENDED_MOVIES_URL.ts';
import { RECOMMENDED_SHOWS_URL } from '$mocks/data/recommendations/RECOMMENDED_SHOWS_URL.ts';

export const recommendations = [
  http.get(
    RECOMMENDED_SHOWS_URL,
    () => {
      return HttpResponse.json(RecommendedShowsResponseMock);
    },
  ),
  http.get(
    RECOMMENDED_MOVIES_URL,
    () => {
      return HttpResponse.json(RecommendedMoviesResponseMock);
    },
  ),
  http.delete('http://localhost/recommendations/shows/:id', () => {
    return new HttpResponse(null, { status: 204 });
  }),
  http.delete('http://localhost/recommendations/movies/:id', () => {
    return new HttpResponse(null, { status: 204 });
  }),
];
