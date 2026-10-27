import type { Session } from '$lib/features/auth/models/Session.ts';
import { toUserAgent } from '$lib/utils/requests/toUserAgent.ts';
import { serveImage } from './_internal/serveImage.ts';
import type { createImageCache } from './createImageCache.ts';

type CreateImageProxyParams = {
  readonly origin: string;
  readonly imageOrigin: string;
  readonly cache: ReturnType<typeof createImageCache>;
};

type ServeParams = {
  readonly path: string;
  readonly session: Session | Nil;
  readonly ifNoneMatch: string | Nil;
};

export function createImageProxy(
  { origin, imageOrigin, cache }: CreateImageProxyParams,
) {
  const userAgent = toUserAgent(origin);

  return {
    serve: ({ path, session, ifNoneMatch }: ServeParams) =>
      serveImage({ path, session, ifNoneMatch, cache, imageOrigin, userAgent }),
    startSweep: () => cache.startSweep(),
  } as const;
}
