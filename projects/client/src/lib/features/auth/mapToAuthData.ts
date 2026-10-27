import { hasAuthSession } from './hasAuthSession.ts';
import type { AuthData } from './models/AuthData.ts';
import type { Session } from './models/Session.ts';

export function mapToAuthData(session: Session | Nil): AuthData {
  return {
    token: session?.access ?? null,
    isAuthorized: hasAuthSession(session),
  };
}
