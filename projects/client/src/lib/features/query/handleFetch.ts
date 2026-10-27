import { ClientEnvironment } from '$lib/requests/ClientEnvironment.ts';
import type { HandleFetch, RequestEvent } from '@sveltejs/kit';

const DEV_PROXY_PREFIX = `${ClientEnvironment.development}/`;

// A server fetch never reaches Vite's dev proxy; rewriting here keeps the URL the browser replays.
function throughDevProxy(request: Request, event: RequestEvent): Request {
  const url = new URL(request.url);
  if (url.origin !== event.url.origin) return request;
  if (!url.pathname.startsWith(DEV_PROXY_PREFIX)) return request;

  const path = url.pathname.slice(ClientEnvironment.development.length);
  return new Request(
    `${TRAKT_TARGET_ENVIRONMENT}${path}${url.search}`,
    request,
  );
}

// Cloudflare in front of Trakt's hosts rejects the server runtime's default User-Agent.
export const handleFetch: HandleFetch = ({ event, request, fetch }) => {
  const outbound = throughDevProxy(request, event);
  if (new URL(outbound.url).origin === event.url.origin) return fetch(outbound);
  if (outbound.headers.has('user-agent')) return fetch(outbound);

  const headers = new Headers(outbound.headers);
  headers.set('user-agent', event.locals.oauthApp.userAgent);

  return fetch(new Request(outbound, { headers }));
};
