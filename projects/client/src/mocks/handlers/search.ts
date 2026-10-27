import { http, HttpResponse } from 'msw';

import { SearchHereticResponseMock } from '$mocks/data/search/response/SearchHereticResponseMock.ts';
import { MovieHereticResponseMock } from '$mocks/data/summary/movies/heretic/response/MovieHereticResponseMock.ts';

export const search = [
  http.get(
    'http://localhost/search/*',
    ({ request }) => {
      const url = new URL(request.url);
      const searchQuery = url.searchParams.get('query');

      if (
        searchQuery?.toLowerCase() ===
          MovieHereticResponseMock.title.toLowerCase()
      ) {
        return HttpResponse.json(SearchHereticResponseMock);
      }

      return new HttpResponse(null, {
        status: 200,
      });
    },
  ),
];
