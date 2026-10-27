import { server } from '$mocks/server.ts';
import { http, HttpResponse, type JsonBodyType } from 'msw';

type ServeHeaderlessPagesParams = {
  url: string;
  pages: ReadonlyArray<JsonBodyType>;
};

export function serveHeaderlessPages(
  { url, pages }: ServeHeaderlessPagesParams,
) {
  server.use(
    http.get(url, ({ request }) => {
      const page = Number(new URL(request.url).searchParams.get('page') ?? 1);
      const body = page >= 1 ? pages.at(page - 1) : undefined;
      return HttpResponse.json(body ?? {});
    }),
  );
}
