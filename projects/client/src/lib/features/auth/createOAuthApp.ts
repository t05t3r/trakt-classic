import { toUserAgent } from '$lib/utils/requests/toUserAgent.ts';
import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';
import { AUTH_HOST } from './AUTH_HOST.ts';

type CreateOAuthAppParams = {
  readonly origin: string;
  readonly clientId: string;
  readonly authHost?: string;
};

const DEFAULT_RETURN_TO = UrlBuilder.dashboard();

// Only a same-origin absolute path may be returned to; anything else is an open redirect.
function returnToWithin(origin: string, value: string | Nil): string {
  if (!value?.startsWith('/')) return DEFAULT_RETURN_TO;

  try {
    const url = new URL(value, origin);
    if (url.origin !== origin) return DEFAULT_RETURN_TO;
    // Dot segments can leave `//host`, which a browser reads as another origin.
    if (url.pathname.startsWith('//')) return DEFAULT_RETURN_TO;
    return `${url.pathname}${url.search}`;
  } catch {
    return DEFAULT_RETURN_TO;
  }
}

export function createOAuthApp(
  { origin, clientId, authHost = AUTH_HOST }: CreateOAuthAppParams,
) {
  const publicOrigin = new URL(origin).origin;

  return {
    origin: publicOrigin,
    callbackUrl: new URL(UrlBuilder.auth.callback(), publicOrigin).toString(),
    clientId,
    authHost,
    userAgent: toUserAgent(publicOrigin),
    returnTo: (value: string | Nil) => returnToWithin(publicOrigin, value),
  } as const;
}
