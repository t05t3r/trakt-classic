import { BehaviorSubject } from 'rxjs';
import { getContext, setContext } from 'svelte';
import { CONFIRMATION_CONTEXT_KEY } from './CONFIRMATION_CONTEXT_KEY.ts';
import type { ConfirmationRequest } from '../models/ConfirmationRequest.ts';
import type { ConfirmationContext } from './ConfirmationContext.ts';

export function createConfirmationContext(): ConfirmationContext {
  const activeConfirmation = new BehaviorSubject<ConfirmationRequest | Nil>(
    null,
  );

  const showConfirmation = (request: ConfirmationRequest) => {
    const open = activeConfirmation.value;
    if (open) {
      request.onCancel?.();
      return;
    }

    activeConfirmation.next(request);
  };

  const hideConfirmation = () => {
    activeConfirmation.next(null);
  };

  return setContext(
    CONFIRMATION_CONTEXT_KEY,
    getContext<ConfirmationContext>(CONFIRMATION_CONTEXT_KEY) ??
      {
        showConfirmation,
        hideConfirmation,
        activeConfirmation,
      },
  );
}
