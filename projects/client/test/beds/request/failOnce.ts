import { server } from '$mocks/server.ts';
import { notFound } from '$test/beds/request/notFound.ts';
import { http } from 'msw';

// Only the next GET gets the answer, so a retry reaches the handlers registered before it.
export function failOnce(
  url: string,
  answer: () => Response = notFound,
): void {
  server.use(http.get(url, answer, { once: true }));
}
