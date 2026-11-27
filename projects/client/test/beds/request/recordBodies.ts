import { server } from '$mocks/server.ts';
import { http, HttpResponse } from 'msw';

type RecordBodiesOptions =
  | { readonly status?: number; readonly answer?: never }
  | {
    readonly answer: () => Response | Promise<Response>;
    readonly status?: never;
  };

// Keeps each body as its write arrives, so a spec reads it while a held answer waits.
export function recordBodies(
  url: string,
  {
    status = 200,
    answer = () => new HttpResponse(null, { status }),
  }: RecordBodiesOptions = {},
): ReadonlyArray<unknown> {
  const bodies: unknown[] = [];
  server.use(
    http.post(url, async ({ request }) => {
      bodies.push(await request.json());
      return answer();
    }),
  );

  return bodies;
}
