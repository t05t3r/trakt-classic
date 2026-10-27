<script lang="ts">
  import Popover from '$lib/components/menus/Popover.svelte';
  import type { PopoverProps } from '$lib/components/menus/_internal/PopoverProps.ts';

  const { side }: Pick<PopoverProps, 'side'> = $props();

  let open = $state(false);
</script>

<Popover label="Your rating" {side} bind:open>
  {#snippet trigger({ props })}
    <button type="button" {...props}>Rate</button>
  {/snippet}

  <button type="button">Weak</button>
  <button type="button" onclick={() => (open = false)}>Strong</button>
</Popover>
