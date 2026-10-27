<script lang="ts">
  import { afterNavigate, replaceState } from '$app/navigation';
  import { page } from '$app/state';
  import type { Snippet } from 'svelte';

  const { children }: { children: Snippet } = $props();

  // A redirected history step renders the target but keeps the old URL.
  afterNavigate(({ type }) => {
    if (type !== 'popstate') return;
    if (location.href === page.url.href) return;

    replaceState(page.url, page.state);
  });
</script>

{@render children()}
