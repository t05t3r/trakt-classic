import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler<{ path: string }> = ({
  params,
  locals,
  request,
}) =>
  locals.imageProxy.serve({
    path: params.path,
    session: locals.auth,
    ifNoneMatch: request.headers.get('if-none-match'),
  });
