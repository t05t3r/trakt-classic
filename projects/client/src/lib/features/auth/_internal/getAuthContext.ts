import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { getContext } from 'svelte';
import type { AuthContext } from './AuthContext.ts';
import { AUTH_CONTEXT_KEY } from './AUTH_CONTEXT_KEY.ts';

export function getAuthContext(): AuthContext {
  return assertDefined(
    getContext<AuthContext | undefined>(AUTH_CONTEXT_KEY),
    'Auth can only be used within AuthProvider.',
  );
}
