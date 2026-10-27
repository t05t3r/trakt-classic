<script lang="ts">
  import { iffy } from "$lib/utils/function/iffy";
  import type { QueryClient } from "@tanstack/query-core";
  import { onMount, type Snippet } from 'svelte';
  import { setQueryClient } from "./_internal/queryClientContext";

  const { children, client }: { children: Snippet; client: QueryClient } =
    $props();

  setQueryClient(iffy(() => client));

  // Only a mounted client resumes a paused retry on focus or reconnect.
  onMount(() => {
    const mounted = client;
    mounted.mount();
    return () => mounted.unmount();
  });
</script>

{@render children()}
