import { NOOP_FN } from '$lib/utils/NOOP_FN.ts';
import { time } from '$lib/utils/timing/time.ts';
import { OAuthAppMappedMock } from '$mocks/data/auth/mapped/OAuthAppMappedMock.ts';
import { OAUTH_TOKEN_URL } from '$mocks/data/auth/OAUTH_TOKEN_URL.ts';
import { server } from '$mocks/server.ts';
import { http, HttpResponse } from 'msw';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type MockInstance,
  vi,
} from 'vitest';
import { postToAuthHost } from './postToAuthHost.ts';

const SECRET = 'secret-refresh-token';
const BLOCK_PAGE = `<html><body>Blocked ${SECRET}</body></html>`;

function answerTokenWith(response: () => Response) {
  server.use(http.post(OAUTH_TOKEN_URL, response));
}

function blockedByHtml() {
  return new HttpResponse(BLOCK_PAGE, {
    status: 403,
    headers: { 'content-type': 'text/html; charset=UTF-8' },
  });
}

function failingFetch(error: Error): typeof globalThis.fetch {
  return () => Promise.reject(error);
}

function warnedText(warn: MockInstance<typeof console.warn>): string {
  return warn.mock.calls.flat().map(String).join('\n');
}

describe('postToAuthHost', () => {
  let clock = new Date('2026-01-01T00:00:00Z').getTime();
  let warn: MockInstance<typeof console.warn>;

  // The warn throttle outlives a test, so each test starts past the last one's window.
  beforeEach(() => {
    clock += time.minutes(2);
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(clock);
    warn = vi.spyOn(console, 'warn').mockImplementation(NOOP_FN);
  });

  afterEach(() => {
    warn.mockRestore();
    vi.useRealTimers();
  });

  it.each(['/oauth/token', '/oauth/revoke'] as const)(
    'should POST the body as JSON to %s as the OAuth App',
    async (path) => {
      const requests: Array<
        {
          contentType: string | null;
          userAgent: string | null;
          body: unknown;
        }
      > = [];
      server.use(
        http.post(`http://localhost${path}`, async ({ request }) => {
          requests.push({
            contentType: request.headers.get('content-type'),
            userAgent: request.headers.get('user-agent'),
            body: await request.json(),
          });
          return new HttpResponse(null, { status: 204 });
        }),
      );

      const response = await postToAuthHost({
        app: OAuthAppMappedMock,
        fetch,
        path,
        body: { token: 'value', client_id: 'client-id' },
      });

      expect(response.status).toBe(204);
      expect(requests).toEqual([{
        contentType: 'application/json',
        userAgent: OAuthAppMappedMock.userAgent,
        body: { token: 'value', client_id: 'client-id' },
      }]);
      expect(warn).not.toHaveBeenCalled();
    },
  );

  it('should warn of an HTML refusal and hand back the response untouched', async () => {
    answerTokenWith(blockedByHtml);

    const response = await postToAuthHost({
      app: OAuthAppMappedMock,
      fetch,
      path: '/oauth/token',
      body: { refresh_token: SECRET },
    });

    expect(warn.mock.calls).toEqual([
      ['auth host: POST /oauth/token answered 403 (html)'],
    ]);
    expect(response.status).toBe(403);
    expect(await response.text()).toBe(BLOCK_PAGE);
  });

  it('should warn of a refusal without the HTML flag when the answer is not HTML', async () => {
    answerTokenWith(() => new HttpResponse(null, { status: 429 }));

    const response = await postToAuthHost({
      app: OAuthAppMappedMock,
      fetch,
      path: '/oauth/token',
      body: {},
    });

    expect(warn.mock.calls).toEqual([
      ['auth host: POST /oauth/token answered 429'],
    ]);
    expect(response.status).toBe(429);
  });

  it('should warn of the same refusal once per minute', async () => {
    answerTokenWith(blockedByHtml);
    const post = () =>
      postToAuthHost({
        app: OAuthAppMappedMock,
        fetch,
        path: '/oauth/token',
        body: {},
      });

    await post();
    await post();
    vi.setSystemTime(clock + time.minutes(1));
    await post();

    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('should warn of a failed request with its error code and rethrow', async () => {
    const error = new TypeError('fetch failed', {
      cause: { code: 'ECONNRESET' },
    });

    await expect(postToAuthHost({
      app: OAuthAppMappedMock,
      fetch: failingFetch(error),
      path: '/oauth/revoke',
      body: {},
    })).rejects.toBe(error);

    expect(warn.mock.calls).toEqual([
      ['auth host: POST /oauth/revoke failed (ECONNRESET)'],
    ]);
  });

  it('should warn of a failed request without a code when it carries none', async () => {
    const error = new TypeError('fetch failed');

    await expect(postToAuthHost({
      app: OAuthAppMappedMock,
      fetch: failingFetch(error),
      path: '/oauth/revoke',
      body: {},
    })).rejects.toBe(error);

    expect(warn.mock.calls).toEqual([
      ['auth host: POST /oauth/revoke failed'],
    ]);
  });

  it('should warn of each error code on the same path within a minute', async () => {
    const post = (code: string) =>
      postToAuthHost({
        app: OAuthAppMappedMock,
        fetch: failingFetch(new TypeError('fetch failed', { cause: { code } })),
        path: '/oauth/token',
        body: {},
      }).catch(() => undefined);

    await post('ECONNRESET');
    await post('ENOTFOUND');

    expect(warn.mock.calls).toEqual([
      ['auth host: POST /oauth/token failed (ECONNRESET)'],
      ['auth host: POST /oauth/token failed (ENOTFOUND)'],
    ]);
  });

  it('should flag an HTML refusal whatever the case of its content type', async () => {
    answerTokenWith(() =>
      new HttpResponse(BLOCK_PAGE, {
        status: 403,
        headers: { 'content-type': 'Text/HTML; charset=UTF-8' },
      })
    );

    await postToAuthHost({
      app: OAuthAppMappedMock,
      fetch,
      path: '/oauth/token',
      body: {},
    });

    expect(warn.mock.calls).toEqual([
      ['auth host: POST /oauth/token answered 403 (html)'],
    ]);
  });

  it('should never log a token from the request or the answer', async () => {
    answerTokenWith(blockedByHtml);
    await postToAuthHost({
      app: OAuthAppMappedMock,
      fetch,
      path: '/oauth/token',
      body: { refresh_token: SECRET },
    });
    await postToAuthHost({
      app: OAuthAppMappedMock,
      fetch: failingFetch(new TypeError(SECRET, { cause: { code: 'E' } })),
      path: '/oauth/token',
      body: { refresh_token: SECRET },
    }).catch(() => undefined);

    expect(warn).toHaveBeenCalledTimes(2);
    expect(warnedText(warn)).not.toContain(SECRET);
  });
});
