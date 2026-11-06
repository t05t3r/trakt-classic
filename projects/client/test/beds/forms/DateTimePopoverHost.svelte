<script lang="ts">
  import DateTimePopover from '$lib/components/forms/DateTimePopover.svelte';
  import type { DateTimePopoverProps } from '$lib/components/forms/DateTimePopoverProps.ts';

  const { onApply }: Pick<DateTimePopoverProps, 'onApply'> = $props();

  let open = $state(false);
  let anchor = $state<HTMLElement>();
</script>

<button type="button" bind:this={anchor}>Anchor</button>
<button type="button" onclick={() => (open = true)}>Open</button>

<DateTimePopover label="When was it?" {anchor} {onApply} bind:open />
