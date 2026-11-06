<script lang="ts">
  import Popover from '$lib/components/menus/Popover.svelte';
  import type { DateTimePopoverProps } from './DateTimePopoverProps.ts';
  import DateTimeFields from './_internal/DateTimeFields.svelte';

  let {
    label,
    anchor,
    onApply,
    open = $bindable(false),
  }: DateTimePopoverProps = $props();

  const apply = (at: Date) => {
    open = false;
    onApply(at);
  };
</script>

<Popover {label} {anchor} variant="flush" bind:open>
  <DateTimeFields {label} onApply={apply} onCancel={() => (open = false)} />
</Popover>
