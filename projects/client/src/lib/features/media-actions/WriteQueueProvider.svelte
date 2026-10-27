<script lang="ts">
  import { sessionExpired } from '$lib/features/auth/sessionExpired.ts';
  import { iffy } from '$lib/utils/function/iffy.ts';
  import { onDestroy, type Snippet } from 'svelte';
  import { createWriteQueueContext } from './_internal/createWriteQueueContext.ts';

  const { children }: { children: Snippet } = $props();

  const queue = iffy(() =>
    createWriteQueueContext({ sessionExpired$: sessionExpired })
  );

  onDestroy(() => queue.dispose());
</script>

{@render children()}
