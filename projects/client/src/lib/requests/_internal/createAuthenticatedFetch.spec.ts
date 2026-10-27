import { sessionExpired } from '$lib/features/auth/sessionExpired.ts';
import { getToken, setToken } from '$lib/features/auth/token.ts';
import { RefreshResponseMock } from '$mocks/data/auth/response/RefreshResponseMock.ts';
import { server } from '$mocks/server.ts';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAuthenticatedFetch } from './createAuthenticatedFetch.ts';

describe('createAuthenticatedFetch', () => {
  afterEach(() => {
    setToken(null);
    vi.doUnmock('$app/environment');
    vi.resetModules();
  });

  it('should attach the current bearer', async () => {
    setToken({ value: 'token' });
    const authorizations: Array<string | null> = [];
    server.use(http.get('http://localhost/authenticated', ({ request }) => {
      authorizations.push(request.headers.get('Authorization'));
      return new HttpResponse(null, { status: 200 });
    }));

    await createAuthenticatedFetch(fetch)('http://localhost/authenticated');

    expect(authorizations).toEqual(['Bearer token']);
  });

  it('should retry one rejected request with the refreshed bearer', async () => {
    setToken({ value: 'rejected' });
    const authorizations: Array<string | null> = [];
    server.use(
      http.get('http://localhost/retry-authenticated', ({ request }) => {
        const authorization = request.headers.get('Authorization');
        authorizations.push(authorization);
        return authorization === 'Bearer rejected'
          ? new HttpResponse(null, { status: 401 })
          : new HttpResponse(null, { status: 200 });
      }),
      http.post('*/auth/refresh', () => HttpResponse.json(RefreshResponseMock)),
    );

    const response = await createAuthenticatedFetch(fetch)(
      'http://localhost/retry-authenticated',
    );

    expect(response.status).toBe(200);
    expect(authorizations).toEqual([
      'Bearer rejected',
      'Bearer fresh-access-token',
    ]);
  });

  it('should keep the rejected token when the refresh response is invalid', async () => {
    setToken({ value: 'rejected' });
    server.use(
      http.get(
        'http://localhost/invalid-refresh-response',
        () => new HttpResponse(null, { status: 401 }),
      ),
      http.post(
        '*/auth/refresh',
        () => HttpResponse.json({ token: '' }),
      ),
    );

    const response = await createAuthenticatedFetch(fetch)(
      'http://localhost/invalid-refresh-response',
    );

    expect(response.status).toBe(401);
    expect(getToken().value).toBe('rejected');
  });

  it('should end the Session when the refresh answers 401', async () => {
    setToken({ value: 'revoked' });
    const onExpired = vi.fn();
    const subscription = sessionExpired.subscribe(onExpired);
    server.use(
      http.get(
        'http://localhost/revoked-authenticated',
        () => new HttpResponse(null, { status: 401 }),
      ),
      http.post(
        '*/auth/refresh',
        () => new HttpResponse(null, { status: 401 }),
      ),
    );

    try {
      const response = await createAuthenticatedFetch(fetch)(
        'http://localhost/revoked-authenticated',
      );

      expect(response.status).toBe(401);
      expect(onExpired).toHaveBeenCalledOnce();
      expect(getToken().value).toBeNull();
    } finally {
      subscription.unsubscribe();
    }
  });

  it('should send a server-side request without the singleton token or a refresh', async () => {
    vi.resetModules();
    vi.doMock('$app/environment', () => ({ browser: false }));
    const { setToken: setServerToken } = await import(
      '$lib/features/auth/token.ts'
    );
    const { createAuthenticatedFetch: createServerFetch } = await import(
      './createAuthenticatedFetch.ts'
    );
    setServerToken({ value: 'shared' });
    const authorizations: Array<string | null> = [];
    const onRefresh = vi.fn();
    server.use(
      http.get('http://localhost/server-authenticated', ({ request }) => {
        authorizations.push(request.headers.get('Authorization'));
        return new HttpResponse(null, { status: 401 });
      }),
      http.post('*/auth/refresh', () => {
        onRefresh();
        return HttpResponse.json(RefreshResponseMock);
      }),
    );

    const response = await createServerFetch(fetch)(
      'http://localhost/server-authenticated',
    );

    expect(response.status).toBe(401);
    expect(authorizations).toEqual([null]);
    expect(onRefresh).not.toHaveBeenCalled();
  });
});
