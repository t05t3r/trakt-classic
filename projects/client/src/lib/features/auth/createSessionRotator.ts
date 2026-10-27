import { z } from 'zod';
import { NOOP_FN } from '$lib/utils/NOOP_FN.ts';
import { time } from '$lib/utils/timing/time.ts';
import type { createOAuthApp } from './createOAuthApp.ts';
import { mapToSession } from './_internal/mapToSession.ts';
import { postToAuthHost } from './_internal/postToAuthHost.ts';
import { OAuthTokenResponseSchema } from './models/OAuthTokenResponseSchema.ts';
import type { Session } from './models/Session.ts';
import type { RefreshResult } from './models/RefreshResult.ts';

type CreateSessionRotatorParams = Readonly<{
  app: Pick<
    ReturnType<typeof createOAuthApp>,
    'clientId' | 'authHost' | 'userAgent'
  >;
  fetch: typeof globalThis.fetch;
}>;

const OAuthErrorResponseSchema = z.object({ error: z.string() });
const SETTLED_SESSION_TTL = time.minutes(1);

export function createSessionRotator(
  { app, fetch }: CreateSessionRotatorParams,
) {
  const activeRefreshes = new Map<string, Promise<RefreshResult>>();
  const settledSessions = new Map<
    string,
    { expiresAt: number; result: RefreshResult }
  >();

  async function requestRefresh(session: Session): Promise<RefreshResult> {
    try {
      const response = await postToAuthHost({
        app,
        fetch,
        path: '/oauth/token',
        body: {
          grant_type: 'refresh_token',
          refresh_token: session.refresh,
          client_id: app.clientId,
        },
      });

      if (response.status === 400) {
        const body = OAuthErrorResponseSchema.safeParse(
          await response.json().catch(() => null),
        );
        return body.success && body.data.error === 'invalid_grant'
          ? { kind: 'invalid-grant' }
          : { kind: 'unavailable' };
      }

      if (!response.ok) {
        response.body?.cancel().catch(NOOP_FN);
        return { kind: 'unavailable' };
      }

      return {
        kind: 'success',
        session: mapToSession(
          OAuthTokenResponseSchema.parse(await response.json()),
        ),
      };
    } catch {
      return { kind: 'unavailable' };
    }
  }

  function rotate(session: Session): Promise<RefreshResult> {
    const cached = settledSessions.get(session.refresh);
    if (cached && cached.expiresAt > Date.now()) {
      return Promise.resolve(cached.result);
    }
    settledSessions.delete(session.refresh);

    const active = activeRefreshes.get(session.refresh);
    if (active) return active;

    const result = requestRefresh(session).then((value) => {
      activeRefreshes.delete(session.refresh);
      if (value.kind === 'success') {
        settledSessions.set(session.refresh, {
          expiresAt: Date.now() + SETTLED_SESSION_TTL,
          result: value,
        });
      }
      return value;
    });
    activeRefreshes.set(session.refresh, result);
    return result;
  }

  return { rotate };
}
