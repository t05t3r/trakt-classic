import { navigating } from '$test/mocks/navigating.svelte.ts';

type DispatchPageShowParams = {
  persisted: boolean;
  // The app's listener can run before SvelteKit's, so `navigating` clears a task after the dispatch.
  isNavigatingClearedLater?: boolean;
};

// As SvelteKit's client does, a back/forward cache restore clears `navigating`.
export function dispatchPageShow(
  { persisted, isNavigatingClearedLater = false }: DispatchPageShowParams,
) {
  const clearNavigating = () => {
    if (persisted) navigating.shown = null;
  };
  if (!isNavigatingClearedLater) clearNavigating();
  window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted }));
  if (isNavigatingClearedLater) setTimeout(clearNavigating);
}
