<script lang="ts">
  import { afterNavigate } from '$app/navigation';
  import { iffy } from "$lib/utils/function/iffy";
  import type { QueryClient } from "@tanstack/query-core";
  import { onMount, type Snippet } from 'svelte';
  import { setQueryClient } from "./_internal/queryClientContext";
  import { rereadWaitingReaders } from './_internal/readerWaits.ts';

  const { children, client }: { children: Snippet; client: QueryClient } =
    $props();

  setQueryClient(iffy(() => client));

  // Only a mounted client resumes a paused retry on focus or reconnect.
  onMount(() => {
    const mounted = client;
    mounted.mount();
    return () => mounted.unmount();
  });

  // Focus re-reads only a few readers and reconnect only observed ones, so a navigation retries a kept write's reader.
  afterNavigate(() => void rereadWaitingReaders(client));
</script>

{@render children()}
