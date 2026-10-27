import { BehaviorSubject } from 'rxjs';
import { setContext } from 'svelte';
import type { AuthContext } from './AuthContext.ts';
import { AUTH_CONTEXT_KEY } from './AUTH_CONTEXT_KEY.ts';

type CreateAuthContextParams = {
  isAuthorized: boolean;
  logout: () => void;
};

export function createAuthContext(
  { isAuthorized, logout }: CreateAuthContextParams,
): AuthContext {
  const context = { isAuthorized: new BehaviorSubject(isAuthorized), logout };
  return setContext(AUTH_CONTEXT_KEY, context);
}
