<script lang="ts">
  import Popover from '$lib/components/menus/Popover.svelte';

  const { isSwapped = false }: { isSwapped?: boolean } = $props();

  let open = $state(false);
  let anchor = $state<HTMLElement>();
</script>

{#if isSwapped}
  <button type="button" bind:this={anchor}>Second anchor</button>
{:else}
  <button type="button" bind:this={anchor}>First anchor</button>
{/if}

<button type="button" onclick={() => (open = true)}>Open</button>

<Popover label="Your rating" {anchor} variant="flush" bind:open>
  <button type="button">Weak</button>
  <button type="button" onclick={() => (open = false)}>Strong</button>
</Popover>
