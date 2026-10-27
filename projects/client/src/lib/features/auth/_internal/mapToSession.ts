import type { z } from 'zod';
import type { OAuthTokenResponseSchema } from '../models/OAuthTokenResponseSchema.ts';
import type { Session } from '../models/Session.ts';

export function mapToSession(
  response: z.infer<typeof OAuthTokenResponseSchema>,
): Session {
  return {
    access: response.access_token,
    refresh: response.refresh_token,
    expiresAt: Date.now() + response.expires_in * 1000,
  };
}
