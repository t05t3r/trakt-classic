import { building } from '$app/environment';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { createOAuthApp } from '$lib/features/auth/createOAuthApp.ts';
import { createSessionRotator } from '$lib/features/auth/createSessionRotator.ts';
import { handle as handleAuth } from '$lib/features/auth/handle.ts';
import { handle as handleI18n } from '$lib/features/i18n/handle.ts';
import { handle as handleTheme } from '$lib/features/theme/handle.ts';
import { createImageCache } from '$lib/features/image/createImageCache.ts';
import { createImageProxy } from '$lib/features/image/createImageProxy.ts';
import { handle as handleLoadFetch } from '$lib/features/query/handle.ts';
import { handleFetch as handleServerFetch } from '$lib/features/query/handleFetch.ts';
import { assertRuntimeEnv } from '$lib/utils/env/assertRuntimeEnv.ts';
import { parseEnvInt } from '$lib/utils/env/parseEnvInt.ts';
import { parseEnvString } from '$lib/utils/env/parseEnvString.ts';
import { error, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

const DEFAULT_IMAGE_ORIGIN = 'https://media.trakt.tv/images';
const DEFAULT_IMAGE_CACHE_DIR = '.cache/images';
const DEFAULT_IMAGE_CACHE_MAX_BYTES = 5_368_709_120;
const DEFAULT_IMAGE_FETCH_CONCURRENCY = 6;

// Asserted before the factories run, so a missing variable is named instead of surfacing as an invalid URL.
function createRuntime() {
  const env = assertRuntimeEnv({
    env: { ...privateEnv, ...publicEnv },
    required: ['ORIGIN', 'PUBLIC_TRAKT_CLIENT_ID'],
  });

  const oauthApp = createOAuthApp({
    origin: env.ORIGIN,
    clientId: env.PUBLIC_TRAKT_CLIENT_ID,
  });

  const sessionRotator = createSessionRotator({
    app: oauthApp,
    fetch: globalThis.fetch,
  });

  const imageProxy = createImageProxy({
    origin: oauthApp.origin,
    imageOrigin: parseEnvString({
      value: privateEnv.IMAGE_ORIGIN,
      fallback: DEFAULT_IMAGE_ORIGIN,
    }),
    cache: createImageCache({
      dir: parseEnvString({
        value: privateEnv.IMAGE_CACHE_DIR,
        fallback: DEFAULT_IMAGE_CACHE_DIR,
      }),
      maxBytes: parseEnvInt({
        value: privateEnv.IMAGE_CACHE_MAX_BYTES,
        fallback: DEFAULT_IMAGE_CACHE_MAX_BYTES,
        minimum: 0,
      }),
      concurrency: parseEnvInt({
        value: privateEnv.IMAGE_FETCH_CONCURRENCY,
        fallback: DEFAULT_IMAGE_FETCH_CONCURRENCY,
        minimum: 1,
      }),
    }),
  });

  return { oauthApp, imageProxy, sessionRotator } as const;
}

const runtime = building ? null : createRuntime();

export const init = () => {
  runtime?.imageProxy.startSweep();
};

// The one place the build-time null is guarded: no request is served while prerendering.
const handleRuntime: Handle = ({ event, resolve }) => {
  if (!runtime) throw error(500);
  event.locals.oauthApp = runtime.oauthApp;
  event.locals.imageProxy = runtime.imageProxy;
  event.locals.sessionRotator = runtime.sessionRotator;
  event.locals.sessionEnded = false;
  return resolve(event);
};

export const handleFetch = handleServerFetch;

export const handle = sequence(
  handleRuntime,
  handleI18n,
  handleTheme,
  handleAuth,
  handleLoadFetch,
);
