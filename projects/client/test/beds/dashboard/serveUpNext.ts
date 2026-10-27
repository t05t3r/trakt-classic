import { UP_NEXT_URL } from '$mocks/data/sync/UP_NEXT_URL.ts';
import { server } from '$mocks/server.ts';
import { http } from 'msw';

export function serveUpNext(answer: () => Response | Promise<Response>): void {
  server.use(http.get(UP_NEXT_URL, answer));
}
