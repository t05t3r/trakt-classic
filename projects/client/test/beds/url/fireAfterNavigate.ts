import { afterNavigate } from '$app/navigation';
import { vi } from 'vitest';

// The mock keeps no registry, so a component unmounted since its call still hears it.
export function fireAfterNavigate(): void {
  const callbacks = vi.mocked(afterNavigate).mock.calls.map(([callback]) =>
    callback
  );
  if (callbacks.length === 0) {
    throw new Error('No afterNavigate callback is registered');
  }

  callbacks.forEach((callback) =>
    callback({
      type: 'goto',
      from: null,
      to: null,
      willUnload: false,
      complete: Promise.resolve(),
    })
  );
}
