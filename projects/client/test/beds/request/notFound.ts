import { HttpResponse } from 'msw';

// A 404 is never retried, so a failed request settles at once.
export function notFound(): Response {
  return new HttpResponse(null, { status: 404 });
}
