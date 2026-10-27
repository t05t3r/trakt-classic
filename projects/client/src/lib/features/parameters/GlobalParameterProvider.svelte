<script lang="ts">
  import { page } from '$app/state';
  import { sanitizeGlobalParameters } from './_internal/sanitizeGlobalParameters.ts';
  import { useParameters } from './useParameters.ts';
  import type { Snippet } from 'svelte';

  const { children }: { children: Snippet } = $props();
  const { setUrl, update } = useParameters();

  update(sanitizeGlobalParameters(page.url.searchParams));

  $effect(() => {
    setUrl(page.url);
    update(sanitizeGlobalParameters(page.url.searchParams));
  });
</script>

{@render children()}
