import { server } from '$mocks/server.ts';
import { notFound } from '$test/beds/request/notFound.ts';
import { http } from 'msw';

// Only the next GET fails, so a retry reaches the handlers registered before it.
export function failOnce(url: string): void {
  server.use(http.get(url, notFound, { once: true }));
}
