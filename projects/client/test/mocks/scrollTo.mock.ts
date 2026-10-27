import { vi } from 'vitest';

// Guarded: absent under the `node` test environment (server-side specs have no window).
if (typeof window !== 'undefined') {
  Object.defineProperty(
    window,
    'scrollTo',
    {
      value: vi.fn(),
      writable: true,
      configurable: true,
    },
  );
}
