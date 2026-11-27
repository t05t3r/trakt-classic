<script lang="ts">
  import SeasonsBox from '$lib/sections/progress/_internal/SeasonsBox.svelte';
  import type { ComponentProps } from 'svelte';

  type Props = Omit<ComponentProps<typeof SeasonsBox>, 'info'> & {
    isMounted?: boolean;
  };

  const { isMounted = true, ...props }: Props = $props();
</script>

{#if isMounted}
  <SeasonsBox {...props}>
    {#snippet info(controls)}
      {@render controls()}
    {/snippet}
  </SeasonsBox>
{/if}
