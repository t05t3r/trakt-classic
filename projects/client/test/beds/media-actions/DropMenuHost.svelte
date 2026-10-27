<script lang="ts">
  import DropMenu from '$lib/features/media-actions/components/DropMenu.svelte';
  import type { ComponentProps } from 'svelte';

  const { show }: Pick<ComponentProps<typeof DropMenu>, 'show'> = $props();
</script>

<DropMenu {show}>
  {#snippet trigger({ props })}
    <button type="button" {...props}>Drop</button>
  {/snippet}
  {#snippet restoreTrigger({ props })}
    <button type="button" {...props}>Restore</button>
  {/snippet}
</DropMenu>
