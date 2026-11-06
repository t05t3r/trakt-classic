import { server } from '$mocks/server.ts';
import { http, HttpResponse } from 'msw';

export function recordBodies(
  url: string,
  { status = 200 }: { readonly status?: number } = {},
): ReadonlyArray<unknown> {
  const bodies: unknown[] = [];
  server.use(
    http.post(url, async ({ request }) => {
      bodies.push(await request.json());
      return new HttpResponse(null, { status });
    }),
  );

  return bodies;
}
