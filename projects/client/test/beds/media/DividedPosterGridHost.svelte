<script lang="ts" generics="T">
  import DividedPosterGrid from '$lib/components/media/DividedPosterGrid.svelte';
  import type { DividedPosterGridProps } from '$lib/components/media/DividedPosterGridProps.ts';

  const {
    resetKey,
    ...grid
  }: DividedPosterGridProps<T> & { resetKey: string } = $props();
</script>

{#key resetKey}
  <DividedPosterGrid {...grid} />
{/key}
