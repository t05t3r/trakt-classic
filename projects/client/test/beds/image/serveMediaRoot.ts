import { server } from '$mocks/server.ts';
import { notFound } from '$test/beds/request/notFound.ts';
import { http, HttpResponse } from 'msw';

const MEDIA_ROOT_ROUTES = [
  'http://localhost/users/:id/avatar.webp',
  'http://localhost/:kind/:id/:size/:file',
];

// MSW matches on the path alone, so one resolver has to pick each version's answer from the URL.
export function serveMediaRoot(
  bytesByPath: ReadonlyMap<string, Uint8Array<ArrayBuffer>>,
): ReadonlyArray<string> {
  const urls: string[] = [];
  server.use(
    ...MEDIA_ROOT_ROUTES.map((route) =>
      http.get(route, ({ request }) => {
        urls.push(request.url);
        const bytes = bytesByPath.get(
          request.url.replace('http://localhost/', ''),
        );

        return bytes
          ? HttpResponse.arrayBuffer(bytes.buffer, {
            headers: { 'content-type': 'image/webp' },
          })
          : notFound();
      })
    ),
  );

  return urls;
}
