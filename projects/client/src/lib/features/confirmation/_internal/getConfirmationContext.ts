import { getContext } from 'svelte';
import { CONFIRMATION_CONTEXT_KEY } from './CONFIRMATION_CONTEXT_KEY.ts';
import type { ConfirmationContext } from './ConfirmationContext.ts';

export function getConfirmationContext(): ConfirmationContext {
  const context = getContext<ConfirmationContext>(CONFIRMATION_CONTEXT_KEY);
  if (!context) {
    throw new Error(
      'getConfirmationContext must be used within a ConfirmationProvider',
    );
  }
  return context;
}
