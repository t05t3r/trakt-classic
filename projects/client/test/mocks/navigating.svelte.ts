import type { Navigation } from '@sveltejs/kit';

type ShownNavigation = Pick<Navigation, 'type' | 'complete'>;

// As in SvelteKit, `type` and `complete` read the navigation shown, so an effect sees it start and end.
export const navigating = new (class {
  shown = $state.raw<ShownNavigation | null>(null);
  readonly from = null;
  readonly to = null;
  readonly willUnload = null;
  readonly delta = null;

  get type() {
    return this.shown?.type ?? null;
  }

  get complete() {
    return this.shown?.complete ?? null;
  }
})();
