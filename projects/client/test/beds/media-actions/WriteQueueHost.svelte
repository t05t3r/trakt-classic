<script lang="ts">
  import type { WriteQueue } from '$lib/features/media-actions/_internal/createWriteQueue.ts';
  import { useWriteQueue } from '$lib/features/media-actions/stores/useWriteQueue.ts';
  import WriteQueueProvider from '$lib/features/media-actions/WriteQueueProvider.svelte';
  import StoreRunner from '$test/beds/store/_internal/StoreRunner.svelte';

  const { output }: { output: (queue: WriteQueue) => void } = $props();
</script>

<WriteQueueProvider>
  <StoreRunner
    factory={useWriteQueue}
    output={(value) => output(value as WriteQueue)}
  />
</WriteQueueProvider>
