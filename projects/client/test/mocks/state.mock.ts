import { afterEach, vi } from 'vitest';

const page = vi.hoisted(() => ({
  get url() {
    return new URL(window.location.href);
  },
  route: {
    id: null,
  },
  error: null as App.Error | null,
  state: {},
}));

// No navigation is in flight; a spec starts one with startNavigation.
vi.mock('$app/state', async () => {
  const { navigating } = await import('$test/mocks/navigating.svelte.ts');
  return { page, navigating };
});

afterEach(() => {
  page.error = null;
  page.route.id = null;
});

// Server-side specs run without a window.
if (typeof window !== 'undefined') {
  const initialHref = window.location.href;

  afterEach(() => {
    window.history.replaceState(null, '', initialHref);
  });
}
