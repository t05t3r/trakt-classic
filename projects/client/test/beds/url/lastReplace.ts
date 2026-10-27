import { goto } from '$app/navigation';
import { vi } from 'vitest';

export function lastReplace() {
  const url = new URL(String(vi.mocked(goto).mock.lastCall?.at(0)));
  return `${url.pathname}${url.search}${url.hash}`;
}
