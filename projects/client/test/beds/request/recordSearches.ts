import { server } from '$mocks/server.ts';
import { http, HttpResponse, type JsonBodyType } from 'msw';

export function recordSearches(
  url: string,
  body: JsonBodyType,
): ReadonlyArray<URLSearchParams> {
  const searches: URLSearchParams[] = [];
  server.use(
    http.get(url, ({ request }) => {
      searches.push(new URL(request.url).searchParams);
      return HttpResponse.json(body);
    }),
  );

  return searches;
}
