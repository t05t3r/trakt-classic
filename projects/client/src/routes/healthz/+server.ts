import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = () =>
  new Response('ok', {
    headers: {
      'cache-control': 'no-store',
      'content-type': 'text/plain',
    },
  });
