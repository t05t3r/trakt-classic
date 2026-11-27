import { NOOP_FN } from '$lib/utils/NOOP_FN.ts';
import { navigating } from '$test/mocks/navigating.svelte.ts';
import type { NavigationType } from '@sveltejs/kit';
import { onTestFinished } from 'vitest';

// The mocked `navigating` shows a navigation in flight until the spec lands or cancels it.
export function startNavigation(
  type: Exclude<NavigationType, 'enter'> = 'link',
) {
  const complete = Promise.withResolvers<void>();
  // As in SvelteKit, a cancelled navigation's rejection is handled off the chain.
  complete.promise.catch(NOOP_FN);
  const shown = { type, complete: complete.promise };
  navigating.shown = shown;
  // SvelteKit clears `navigating` before the code awaiting `complete` runs.
  const land = () => {
    // A later navigation's handle owns what is shown once it starts.
    if (navigating.shown === shown) navigating.shown = null;
    complete.resolve();
  };
  // A navigation a failed test left in flight would hold every later one.
  onTestFinished(land);

  return {
    land,
    // SvelteKit shows a cancelled navigation until the one that cancelled it starts.
    cancel: () => complete.reject(new Error('navigation aborted')),
  };
}
