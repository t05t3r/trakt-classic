import { browser } from '$app/environment';
import { navigating } from '$app/state';
import { NOOP_FN } from '$lib/utils/NOOP_FN.ts';

type NavigationStep = () => Promise<void> | undefined;

let lastStep: Promise<void> = Promise.resolve();
let settleRunning: () => void = NOOP_FN;

// A goto that reloads never settles; a bfcache restore settles the running step.
if (browser) {
  addEventListener('pageshow', (event) => {
    if (event.persisted) settleRunning();
  });
}

function runStep(step: NavigationStep): Promise<void> {
  return new Promise((resolve, reject) => {
    settleRunning = resolve;
    Promise.resolve(step()).then(resolve, reject);
  });
}

// A step started during a navigation would cancel it. The server shows none and runs no effect.
function afterNavigation(): Promise<void> {
  if (navigating.complete === null) return Promise.resolve();

  // SvelteKit never settles a navigation that unloads the page or that a bfcache restore clears.
  return new Promise((resolve) => {
    const stop = $effect.root(() => {
      $effect.pre(() => {
        const shown = navigating.complete;
        // A cancelled navigation still shown leaves nothing to wait for.
        void Promise.resolve(shown).catch(NOOP_FN).then(() => {
          if (navigating.complete !== shown) return;
          stop();
          resolve();
        });
      });
    });
  });
}

// Each step reads the URL the step before it leaves, which lands before its goto resolves.
export function queueNavigation(step: NavigationStep): Promise<void> {
  // Callers fire and forget, so a failed step settles quietly.
  lastStep = lastStep.then(afterNavigation).then(() => runStep(step))
    .catch(NOOP_FN);
  return lastStep;
}
