import { createAuthenticatedFetch } from '$lib/requests/_internal/createAuthenticatedFetch.ts';
import { env } from '$env/dynamic/public';
import { ClientEnvironment } from '$lib/requests/ClientEnvironment.ts';
import { IS_PREVIEW } from '$lib/utils/IS_PREVIEW.ts';
import { traktApi, type TraktApiOptions } from '@trakt/api';

type RawApiFetchParams = {
  environment?: HttpsUrl;
  fetch?: typeof fetch;
  path: string;
  init?: Omit<RequestInit, 'headers'> & { headers?: Record<string, string> };
  // Defaults to true (attach the signed-in user's Bearer token). Pass false for
  // requests authorized out-of-band (e.g. the WebView `slurm` token): no Bearer
  // is sent, so a different account's token can never mix with the request, and
  // a 401 cannot tear down the web session.
  authenticated?: boolean;
};

export type ApiParams = Omit<TraktApiOptions, 'apiKey' | 'environment'> & {
  environment?: HttpsUrl;
  authenticated?: boolean;
  onResponse?: (response: Response) => void;
  signal?: AbortSignal;
};

const IS_DEV = TRAKT_MODE.startsWith('development');
const IS_TEST = TRAKT_MODE.startsWith('test');

const ENV = (() => {
  if (IS_DEV || IS_PREVIEW) {
    return ClientEnvironment.development as unknown as HttpsUrl;
  }

  if (IS_TEST) {
    return ClientEnvironment.test as unknown as HttpsUrl;
  }

  return TRAKT_TARGET_ENVIRONMENT as unknown as HttpsUrl;
})();

const TRAKT_CLIENT_ID = env.PUBLIC_TRAKT_CLIENT_ID ?? '';

function tapResponse(
  baseFetch: typeof fetch,
  onResponse: ApiParams['onResponse'],
): typeof fetch {
  if (!onResponse) return baseFetch;

  return (input, init) =>
    baseFetch(input, init).then((response) => {
      onResponse(response);
      return response;
    });
}

function withSignal(
  baseFetch: typeof fetch,
  signal: ApiParams['signal'],
): typeof fetch {
  if (!signal) return baseFetch;

  return (input, init) => baseFetch(input, { ...init, signal });
}

// ts-rest drops a falsy path param, so a season or an episode 0 goes as a string.
const toPathValue = (value: unknown) =>
  typeof value === 'number' ? `${value}` : value;

const isObject = (value: unknown): value is object =>
  typeof value === 'object' && value !== null;

function withStringParams(args: unknown): unknown {
  if (!isObject(args) || !('params' in args)) return args;
  if (!isObject(args.params)) return args;

  const params = Object.entries(args.params)
    .map(([key, value]) => [key, toPathValue(value)]);

  return { ...args, params: Object.fromEntries(params) };
}

function keepZeroPathParams<T extends object>(node: T): T {
  return new Proxy(node, {
    get(target, key) {
      const value: unknown = Reflect.get(target, key);
      if (!Object.hasOwn(target, key)) return value;
      if (typeof value === 'function') {
        return (args: unknown) => value(withStringParams(args));
      }
      if (isObject(value)) return keepZeroPathParams(value);

      return value;
    },
  });
}

export const api = ({
  environment = ENV,
  fetch = globalThis.fetch,
  cancellable = false,
  cancellationId,
  onResponse,
  signal,
  authenticated = true,
}: ApiParams = {}) =>
  keepZeroPathParams(traktApi({
    apiKey: TRAKT_CLIENT_ID,
    environment,
    // Applied outside the authenticated fetch so it never aborts a refresh.
    fetch: tapResponse(
      withSignal(
        authenticated ? createAuthenticatedFetch(fetch) : fetch,
        signal,
      ),
      onResponse,
    ),
    cancellable,
    cancellationId,
  }));

export const rawApiFetch = ({
  environment = ENV,
  fetch = globalThis.fetch,
  path,
  init,
  authenticated = true,
}: RawApiFetchParams) => {
  const { headers: additionalHeaders, ...restInit } = init ?? {};
  // Unauthenticated requests use the bare fetch: no Bearer token, and none of
  // the 401 re-authentication side effects that would sign out a web session.
  const baseFetch = authenticated ? createAuthenticatedFetch(fetch) : fetch;
  return baseFetch(`${environment}${path}`, {
    ...restInit,
    headers: {
      'trakt-api-version': '2',
      'trakt-api-key': TRAKT_CLIENT_ID,
      ...additionalHeaders,
    },
  });
};
