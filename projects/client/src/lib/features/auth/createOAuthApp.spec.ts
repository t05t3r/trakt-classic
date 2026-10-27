import { toUserAgent } from '$lib/utils/requests/toUserAgent.ts';
import { describe, expect, it } from 'vitest';
import { createOAuthApp } from './createOAuthApp.ts';

describe('createOAuthApp', () => {
  const params = {
    origin: 'https://classic.example.test',
    clientId: 'client-id',
  };

  it('should build the callback URL from the public origin', () => {
    const oauthApp = createOAuthApp(params);

    expect(oauthApp.callbackUrl).toBe(
      'https://classic.example.test/auth/callback',
    );
  });

  it('should reduce a configured origin with a path or trailing slash to its origin', () => {
    const oauthApp = createOAuthApp({
      ...params,
      origin: 'https://classic.example.test/some/path/',
    });

    expect(oauthApp.origin).toBe('https://classic.example.test');
    expect(oauthApp.callbackUrl).toBe(
      'https://classic.example.test/auth/callback',
    );
  });

  it('should carry the client id as given', () => {
    const oauthApp = createOAuthApp(params);

    expect(oauthApp.clientId).toBe('client-id');
  });

  it('should identify itself to the auth host by product, version and public origin', () => {
    const oauthApp = createOAuthApp({
      ...params,
      origin: 'https://classic.example.test/some/path/',
    });

    expect(oauthApp.userAgent).toBe(
      toUserAgent('https://classic.example.test'),
    );
  });

  it('should talk to the Trakt auth host by default', () => {
    const oauthApp = createOAuthApp(params);

    expect(oauthApp.authHost).toBe('https://auth.trakt.tv');
  });

  it('should carry a given auth host', () => {
    const oauthApp = createOAuthApp({
      ...params,
      authHost: 'http://localhost',
    });

    expect(oauthApp.authHost).toBe('http://localhost');
  });

  describe('returnTo', () => {
    it('should keep same-origin absolute paths', () => {
      const oauthApp = createOAuthApp(params);

      expect(oauthApp.returnTo('/calendar?week=1')).toBe('/calendar?week=1');
    });

    it('should fall back for protocol-relative and malformed paths', () => {
      const oauthApp = createOAuthApp(params);

      expect(oauthApp.returnTo('//elsewhere.test')).toBe('/dashboard');
      expect(oauthApp.returnTo('/\\\\elsewhere.test')).toBe('/dashboard');
      expect(oauthApp.returnTo('https://elsewhere.test')).toBe('/dashboard');
    });

    it.each([
      '/.//evil.com',
      '/..//evil.com',
      '/%2e//evil.com',
      '/a/..//evil.com',
    ])(
      'should fall back when %s normalises to a protocol-relative path',
      (value) => {
        const oauthApp = createOAuthApp(params);

        expect(oauthApp.returnTo(value)).toBe('/dashboard');
      },
    );

    it('should fall back when nothing was asked for', () => {
      const oauthApp = createOAuthApp(params);

      expect(oauthApp.returnTo(null)).toBe('/dashboard');
      expect(oauthApp.returnTo(undefined)).toBe('/dashboard');
    });
  });
});
