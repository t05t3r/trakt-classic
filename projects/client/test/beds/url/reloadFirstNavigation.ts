import { goto } from '$app/navigation';
import { NOOP_FN } from '$lib/utils/NOOP_FN.ts';
import { startNavigation } from '$test/beds/url/startNavigation.ts';
import { onTestFinished, vi } from 'vitest';

// The first navigation reloads the page: it stays shown, and neither it nor its goto settles.
export function reloadFirstNavigation(): Promise<void> {
  const unloading = Promise.withResolvers<void>();
  vi.mocked(goto).mockImplementationOnce(() => {
    startNavigation();
    unloading.resolve();
    return new Promise(NOOP_FN);
  });
  onTestFinished(() => {
    vi.mocked(goto).mockReset();
  });
  return unloading.promise;
}
