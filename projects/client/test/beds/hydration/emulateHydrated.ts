import { setHydrated } from '$lib/utils/hydration/hydration.ts';
import { onTestFinished } from 'vitest';

// The rest of the test runs as on the client once the page has hydrated.
export function emulateHydrated(): void {
  setHydrated(true);
  onTestFinished(() => setHydrated(false));
}
