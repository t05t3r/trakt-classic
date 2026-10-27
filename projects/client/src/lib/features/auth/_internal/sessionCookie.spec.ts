import { mockRequestEvent } from '$test/request/mockRequestEvent.ts';
import { describe, expect, it } from 'vitest';
import { sessionCookie } from './sessionCookie.ts';

function browserCookies() {
  return mockRequestEvent({ url: 'http://localhost' }).cookies;
}

describe('sessionCookie.read', () => {
  it('should return no Session when the cookie is absent', () => {
    expect(sessionCookie.read(browserCookies())).toBeNull();
  });

  it('should return a valid Session cookie', () => {
    const cookies = browserCookies();
    cookies.set(
      sessionCookie.name,
      JSON.stringify({
        access: 'access',
        refresh: 'refresh',
        expiresAt: 1_000,
      }),
      {},
    );

    expect(sessionCookie.read(cookies))
      .toEqual({ access: 'access', refresh: 'refresh', expiresAt: 1_000 });
  });

  it.each([
    ['not json', 'not json'],
    ['a partial Session', JSON.stringify({ access: 'access' })],
  ])('should remove a cookie holding %s and return no Session', (_, raw) => {
    const cookies = browserCookies();
    cookies.set(sessionCookie.name, raw, {});

    expect(sessionCookie.read(cookies)).toBeNull();
    expect(cookies.get(sessionCookie.name)).toBeNull();
  });
});
