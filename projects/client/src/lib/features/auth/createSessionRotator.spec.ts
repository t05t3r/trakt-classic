import { time } from '$lib/utils/timing/time.ts';
import { OAuthAppMappedMock } from '$mocks/data/auth/mapped/OAuthAppMappedMock.ts';
import { OAuthTokenResponseMock } from '$mocks/data/auth/response/OAuthTokenResponseMock.ts';
import { OAUTH_TOKEN_URL } from '$mocks/data/auth/OAUTH_TOKEN_URL.ts';
import { server } from '$mocks/server.ts';
import { silenceWarnings } from '$test/beds/console/silenceWarnings.ts';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, onTestFinished, vi } from 'vitest';
import { createSessionRotator } from './createSessionRotator.ts';

describe('createSessionRotator', () => {
  it('should refresh as the OAuth App and map the response to a Session', async () => {
    const tokenBodies: Array<Record<string, unknown>> = [];
    const userAgents: Array<string | null> = [];
    server.use(
      http.post(OAUTH_TOKEN_URL, async ({ request }) => {
        userAgents.push(request.headers.get('user-agent'));
        tokenBodies.push(await request.json() as Record<string, unknown>);
        return HttpResponse.json(OAuthTokenResponseMock);
      }),
    );
    const rotator = createSessionRotator({ app: OAuthAppMappedMock, fetch });

    const result = await rotator.rotate({
      access: 'old-access',
      refresh: 'plain-refresh',
      expiresAt: 0,
    });

    expect(result).toMatchObject({
      kind: 'success',
      session: {
        access: OAuthTokenResponseMock.access_token,
        refresh: OAuthTokenResponseMock.refresh_token,
      },
    });
    expect(tokenBodies).toEqual([{
      grant_type: 'refresh_token',
      refresh_token: 'plain-refresh',
      client_id: OAuthAppMappedMock.clientId,
    }]);
    expect(userAgents).toEqual([OAuthAppMappedMock.userAgent]);
  });

  it('should distinguish invalid grants from unavailable auth service failures', async () => {
    silenceWarnings();
    const rotator = createSessionRotator({ app: OAuthAppMappedMock, fetch });

    server.use(
      http.post(
        OAUTH_TOKEN_URL,
        () => HttpResponse.json({ error: 'invalid_grant' }, { status: 400 }),
      ),
    );
    const invalidGrant = await rotator.rotate({
      access: 'access',
      refresh: 'invalid-grant-refresh',
      expiresAt: 0,
    });

    server.use(
      http.post(
        OAUTH_TOKEN_URL,
        () => new HttpResponse(null, { status: 429 }),
      ),
    );
    const unavailable = await rotator.rotate({
      access: 'access',
      refresh: 'unavailable-refresh',
      expiresAt: 0,
    });

    expect(invalidGrant).toEqual({ kind: 'invalid-grant' });
    expect(unavailable).toEqual({ kind: 'unavailable' });
  });

  it('should read a 400 with an error other than invalid_grant as unavailable', async () => {
    silenceWarnings();
    server.use(
      http.post(
        OAUTH_TOKEN_URL,
        () => HttpResponse.json({ error: 'invalid_request' }, { status: 400 }),
      ),
    );
    const rotator = createSessionRotator({ app: OAuthAppMappedMock, fetch });

    const result = await rotator.rotate({
      access: 'access',
      refresh: 'invalid-request-refresh',
      expiresAt: 0,
    });

    expect(result).toEqual({ kind: 'unavailable' });
  });

  it('should coalesce concurrent rotations of the same Session into a single origin call', async () => {
    const tokenBodies: Array<Record<string, unknown>> = [];
    server.use(
      http.post(OAUTH_TOKEN_URL, async ({ request }) => {
        tokenBodies.push(await request.json() as Record<string, unknown>);
        return HttpResponse.json(OAuthTokenResponseMock);
      }),
    );
    const rotator = createSessionRotator({ app: OAuthAppMappedMock, fetch });
    const session = {
      access: 'old-access',
      refresh: 'concurrent-refresh',
      expiresAt: 0,
    };

    const [first, second] = await Promise.all([
      rotator.rotate(session),
      rotator.rotate(session),
    ]);

    expect(tokenBodies).toHaveLength(1);
    expect(first).toEqual(second);
    expect(first).toMatchObject({ kind: 'success' });
  });

  it('should reuse a settled success for a sequential rotation of the same Session', async () => {
    const tokenBodies: Array<Record<string, unknown>> = [];
    server.use(
      http.post(OAUTH_TOKEN_URL, async ({ request }) => {
        tokenBodies.push(await request.json() as Record<string, unknown>);
        return HttpResponse.json(OAuthTokenResponseMock);
      }),
    );
    const rotator = createSessionRotator({ app: OAuthAppMappedMock, fetch });
    const session = {
      access: 'old-access',
      refresh: 'sequential-refresh',
      expiresAt: 0,
    };

    const first = await rotator.rotate(session);
    const second = await rotator.rotate(session);

    expect(tokenBodies).toHaveLength(1);
    expect(first).toEqual(second);
    expect(first).toMatchObject({ kind: 'success' });
  });

  it('should reuse a settled success for under a minute and reach the origin again once it is a minute old', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    onTestFinished(() => {
      vi.useRealTimers();
    });
    const start = new Date('2026-01-01T00:00:00Z').getTime();
    vi.setSystemTime(start);
    const tokenBodies: Array<Record<string, unknown>> = [];
    server.use(
      http.post(OAUTH_TOKEN_URL, async ({ request }) => {
        tokenBodies.push(await request.json() as Record<string, unknown>);
        return HttpResponse.json(OAuthTokenResponseMock);
      }),
    );
    const rotator = createSessionRotator({ app: OAuthAppMappedMock, fetch });
    const session = {
      access: 'old-access',
      refresh: 'expiring-cache-refresh',
      expiresAt: 0,
    };

    await rotator.rotate(session);
    vi.setSystemTime(start + time.minutes(1) - 1);
    await rotator.rotate(session);

    expect(tokenBodies).toHaveLength(1);

    vi.setSystemTime(start + time.minutes(1));
    const later = await rotator.rotate(session);

    expect(tokenBodies).toHaveLength(2);
    expect(later).toMatchObject({ kind: 'success' });
  });

  it('should not cache a failed rotation, so a sequential retry reaches the origin again', async () => {
    silenceWarnings();
    let calls = 0;
    server.use(
      http.post(OAUTH_TOKEN_URL, () => {
        calls += 1;
        return new HttpResponse(null, { status: 429 });
      }),
    );
    const rotator = createSessionRotator({ app: OAuthAppMappedMock, fetch });
    const session = {
      access: 'access',
      refresh: 'failing-refresh',
      expiresAt: 0,
    };

    const first = await rotator.rotate(session);
    const second = await rotator.rotate(session);

    expect(calls).toBe(2);
    expect(first).toEqual({ kind: 'unavailable' });
    expect(second).toEqual({ kind: 'unavailable' });
  });
});
