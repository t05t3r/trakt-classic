import { createWarnOnce } from '$lib/utils/console/createWarnOnce.ts';
import { time } from '$lib/utils/timing/time.ts';
import type { createOAuthApp } from '../createOAuthApp.ts';

type PostToAuthHostParams = {
  readonly app: Pick<
    ReturnType<typeof createOAuthApp>,
    'authHost' | 'userAgent'
  >;
  readonly fetch: typeof globalThis.fetch;
  readonly path: '/oauth/token' | '/oauth/revoke';
  readonly body: Record<string, unknown>;
};

const WARN_WINDOW_MS = time.minutes(1);

// One console.warn per path and status, or path and error code, per minute, so a blocked auth host doesn't log every refresh.
const warnOnce = createWarnOnce({ windowMs: WARN_WINDOW_MS });

function htmlFlag(response: Response): string {
  const contentType = response.headers.get('content-type') ?? '';
  return contentType.toLowerCase().startsWith('text/html') ? ' (html)' : '';
}

function codeFlag(error: unknown): string {
  if (!(error instanceof Error)) return '';

  const cause = error.cause;
  if (typeof cause !== 'object' || cause === null) return '';
  if (!('code' in cause) || typeof cause.code !== 'string') return '';

  return ` (${cause.code})`;
}

// Logs only the fixed path, status and error code: the bodies carry tokens.
export async function postToAuthHost(
  { app, fetch, path, body }: PostToAuthHostParams,
): Promise<Response> {
  const response = await fetch(`${app.authHost}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'user-agent': app.userAgent,
    },
    body: JSON.stringify(body),
  }).catch((error: unknown) => {
    const failure = `${path} failed${codeFlag(error)}`;
    warnOnce(failure, `auth host: POST ${failure}`);
    throw error;
  });

  if (response.ok) return response;

  warnOnce(
    `${path} ${response.status}`,
    `auth host: POST ${path} answered ${response.status}${htmlFlag(response)}`,
  );
  return response;
}
