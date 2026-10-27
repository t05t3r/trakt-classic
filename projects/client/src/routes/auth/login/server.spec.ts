import { authStateCookie } from '$lib/features/auth/authStateCookie.ts';
import { toCodeChallenge } from '$lib/features/auth/toCodeChallenge.ts';
import { OAuthAppMappedMock } from '$mocks/data/auth/mapped/OAuthAppMappedMock.ts';
import { mockRequestEvent } from '$test/request/mockRequestEvent.ts';
import { describe, expect, it, onTestFinished, vi } from 'vitest';
import { GET } from './+server.ts';

async function signIn(returnTo = '/calendar') {
  const event = mockRequestEvent({
    url: `http://vite-upstream/auth/login?${new URLSearchParams({ returnTo })}`,
    locals: { oauthApp: OAuthAppMappedMock },
  });

  const thrown = await Promise.resolve()
    .then(() => GET(event))
    .catch((error: unknown) => error);
  const authorizeUrl = new URL(
    (thrown as { location?: string }).location ?? '',
  );

  return { event, authorizeUrl };
}

describe('GET /auth/login', () => {
  it('should send the viewer to the OAuth App authorize URL with only the authorize params', async () => {
    const { event, authorizeUrl } = await signIn();
    const state = authStateCookie.read(event.cookies);

    expect(authorizeUrl.origin).toBe(OAuthAppMappedMock.authHost);
    expect(authorizeUrl.pathname).toBe('/oauth/authorize');
    expect(Object.fromEntries(authorizeUrl.searchParams)).toEqual({
      response_type: 'code',
      client_id: 'client-id',
      redirect_uri: OAuthAppMappedMock.callbackUrl,
      state: state?.nonce,
      code_challenge: await toCodeChallenge(state?.codeVerifier ?? ''),
      code_challenge_method: 'S256',
    });
    expect(event.cookies.set).toHaveBeenCalledWith(
      authStateCookie.name,
      expect.any(String),
      expect.any(Object),
    );
  });

  it('should send the S256 challenge of the code verifier it keeps in the state cookie', async () => {
    const { event, authorizeUrl } = await signIn();
    const state = authStateCookie.read(event.cookies);

    expect(authorizeUrl.searchParams.get('code_challenge_method')).toBe('S256');
    expect(state?.codeVerifier).toMatch(/^[A-Za-z0-9._~-]{43,128}$/);
    expect(authorizeUrl.searchParams.get('code_challenge')).toBe(
      await toCodeChallenge(state?.codeVerifier ?? ''),
    );
  });

  it('should write no state cookie when the code challenge cannot be derived', async () => {
    const digest = vi.spyOn(crypto.subtle, 'digest').mockRejectedValueOnce(
      new Error('digest unavailable'),
    );
    onTestFinished(() => digest.mockRestore());
    const event = mockRequestEvent({
      url: 'http://vite-upstream/auth/login?returnTo=/calendar',
      locals: { oauthApp: OAuthAppMappedMock },
    });

    await expect(Promise.resolve().then(() => GET(event))).rejects.toThrow(
      'digest unavailable',
    );
    expect(event.cookies.set).not.toHaveBeenCalled();
  });

  it('should start each sign-in with a new code verifier', async () => {
    const first = await signIn();
    const second = await signIn();

    expect(first.authorizeUrl.searchParams.get('code_challenge')).not.toBe(
      second.authorizeUrl.searchParams.get('code_challenge'),
    );
  });

  it('should keep the returnTo path in the state cookie', async () => {
    const { event } = await signIn();

    expect(authStateCookie.read(event.cookies)?.returnTo).toBe('/calendar');
  });

  it('should keep the dashboard in the state cookie for an off-origin returnTo', async () => {
    const { event } = await signIn('//evil.example.com/calendar');

    expect(authStateCookie.read(event.cookies)?.returnTo).toBe('/dashboard');
  });
});
