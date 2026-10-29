import { page } from '$app/state';
import type { ResolvedPathname } from '$app/types';
import { openAt } from '$test/beds/url/openAt.ts';
import { SvelteURL } from 'svelte/reactivity';
import { onTestFinished, vi } from 'vitest';
import { landReplaces } from '$test/beds/url/_internal/landReplaces.ts';

// page.url reads a rune here, so a store that lifts it with fromRune sees each replace land.
export function followReplaces(pathname: ResolvedPathname): void {
  openAt(pathname);
  let href = $state(window.location.href);
  const url = vi.spyOn(page, 'url', 'get').mockImplementation(() =>
    Object.assign(new SvelteURL(href), { pathname })
  );
  landReplaces(() => {
    href = window.location.href;
  });
  onTestFinished(() => {
    url.mockRestore();
  });
}
