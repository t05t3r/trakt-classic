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

// No navigation is in flight; a spec spies on a getter to start one.
const navigating = vi.hoisted(() => ({
  get from() {
    return null;
  },
  get to() {
    return null;
  },
  get type() {
    return null;
  },
  get willUnload() {
    return null;
  },
  get delta() {
    return null;
  },
  get complete() {
    return null;
  },
}));

vi.mock('$app/state', () => ({ page, navigating }));

afterEach(() => {
  page.error = null;
});

// Server-side specs run without a window.
if (typeof window !== 'undefined') {
  const initialHref = window.location.href;

  afterEach(() => {
    window.history.replaceState(null, '', initialHref);
  });
}
