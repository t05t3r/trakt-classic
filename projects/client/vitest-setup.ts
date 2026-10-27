//https://github.com/testing-library/jest-dom?tab=readme-ov-file#with-vitest
import '@testing-library/jest-dom/vitest';
import '$test/mocks/animate.mock.ts';
import '$test/mocks/env.mock.ts';
import '$test/mocks/IntersectionObserver.mock.ts';
import '$test/mocks/ls.mock.ts';
import '$test/mocks/matchMedia.mock.ts';
import '$test/mocks/messages.mock.ts';
import '$test/mocks/navigation.mock.ts';
import '$test/mocks/navigator.mock.ts';
import '$test/mocks/ResizeObserver.mock.ts';
import '$test/mocks/scrollTo.mock.ts';
import '$test/mocks/state.mock.ts';
import '$test/mocks/variables.mock.ts';
import { useToasts } from '$lib/features/action-toast/stores/useToasts.ts';
import { resetHiddenRecommendations } from '$lib/features/media-actions/resetHiddenRecommendations.ts';
import { resetPendingOverrides } from '$lib/features/media-actions/resetPendingOverrides.ts';
import { server } from '$mocks/server.ts';
import { bodyUnlocked } from '$test/beds/scroll-lock/bodyUnlocked.ts';
import { act, cleanup } from '@testing-library/svelte';
import process from 'node:process';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

// jsdom does not implement Blob.prototype.arrayBuffer
// (used by file-based parsers before passing the buffer to mocked unzipSync)
if (!Blob.prototype.arrayBuffer) {
  Blob.prototype.arrayBuffer = function () {
    return Promise.resolve(new ArrayBuffer(0));
  };
}

process.env.TZ = 'UTC';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  vi.clearAllMocks();
  server.resetHandlers();
});
// The toast list is module state, so a toast would outlive its test.
afterEach(() => {
  const { toasts, dismiss } = useToasts();
  toasts.subscribe((entries) => entries.forEach(({ id }) => dismiss(id)))
    .unsubscribe();
});
// A write still pending at a test's end would leak its override into the next.
afterEach(() => resetPendingOverrides());
// A hidden recommendation is module state, so it would stay hidden in the next test.
afterEach(() => resetHiddenRecommendations());
afterEach(async () => {
  if (typeof window === 'undefined') return;
  await act();
  cleanup();
  // bits-ui unlocks body scroll on a timer that must not outlive jsdom.
  await bodyUnlocked();
});
afterAll(() => server.close());
