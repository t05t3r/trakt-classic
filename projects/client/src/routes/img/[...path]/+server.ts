import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler<{ path: string }> = ({
  params,
  locals,
  request,
  url,
}) =>
  locals.imageProxy.serve({
    path: `${params.path}${url.search}`,
    session: locals.auth,
    ifNoneMatch: request.headers.get('if-none-match'),
  });
