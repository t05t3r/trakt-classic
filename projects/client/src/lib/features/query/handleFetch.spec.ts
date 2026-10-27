import { toUserAgent } from '$lib/utils/requests/toUserAgent.ts';
import { OAuthAppMappedMock } from '$mocks/data/auth/mapped/OAuthAppMappedMock.ts';
import { mockRequestEvent } from '$test/request/mockRequestEvent.ts';
import { describe, expect, it } from 'vitest';
import { handleFetch } from './handleFetch.ts';

// The dev server's origin, which differs from the app's public origin.
const ORIGIN = 'http://localhost:5173';
const USER_AGENT = toUserAgent(OAuthAppMappedMock.origin);

async function send(request: Request) {
  const sent: Request[] = [];

  await handleFetch({
    event: mockRequestEvent({
      url: `${ORIGIN}/shows/from`,
      locals: { oauthApp: OAuthAppMappedMock },
    }),
    request,
    fetch: (input) => {
      sent.push(new Request(input));
      return Promise.resolve(new Response());
    },
  });

  return sent.at(0);
}

async function sentUserAgent(request: Request) {
  return (await send(request))?.headers.get('user-agent');
}

describe('handleFetch', () => {
  it('should name the app by its public origin to another origin', async () => {
    const userAgent = await sentUserAgent(
      new Request('https://api.trakt.tv/shows/from'),
    );

    expect(userAgent).toBe(USER_AGENT);
  });

  it('should keep a User-Agent the request already sets', async () => {
    const userAgent = await sentUserAgent(
      new Request('https://api.trakt.tv/oauth/token', {
        headers: { 'user-agent': 'own-agent' },
      }),
    );

    expect(userAgent).toBe('own-agent');
  });

  it('should leave a same-origin request alone', async () => {
    const sent = await send(new Request(`${ORIGIN}/shows/from/__data.json`));

    expect(sent?.url).toBe(`${ORIGIN}/shows/from/__data.json`);
    expect(sent?.headers.get('user-agent')).toBeNull();
  });

  it('should send a dev proxy request to the target API, named', async () => {
    const sent = await send(
      new Request(`${ORIGIN}/api/trakt/shows/from?extended=full`),
    );

    expect(sent?.url).toBe(
      `${TRAKT_TARGET_ENVIRONMENT}/shows/from?extended=full`,
    );
    expect(sent?.headers.get('user-agent')).toBe(USER_AGENT);
  });

  it('should leave a same-origin path that only starts like the proxy alone', async () => {
    const sent = await send(new Request(`${ORIGIN}/api/traktor`));

    expect(sent?.url).toBe(`${ORIGIN}/api/traktor`);
  });
});
