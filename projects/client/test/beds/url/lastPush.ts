import { goto } from '$app/navigation';
import { expect, vi } from 'vitest';

// A string and only keepFocus, since a replace passes a URL and also replaceState and noScroll.
export function lastPush() {
  expect(goto).toHaveBeenLastCalledWith(expect.any(String), {
    keepFocus: true,
  });
  return String(vi.mocked(goto).mock.lastCall?.at(0));
}
