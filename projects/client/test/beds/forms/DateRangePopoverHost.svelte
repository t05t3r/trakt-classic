<script lang="ts">
  import DateRangePopover from '$lib/components/forms/DateRangePopover.svelte';
  import type { DateRangePopoverProps } from '$lib/components/forms/DateRangePopoverProps.ts';

  const {
    presets,
    value,
    onApply,
    onClear,
  }: Pick<
    DateRangePopoverProps,
    'presets' | 'value' | 'onApply' | 'onClear'
  > = $props();

  let open = $state(false);
</script>

<DateRangePopover
  label="Date Range"
  {presets}
  {value}
  {onApply}
  {onClear}
  bind:open
>
  {#snippet trigger({ props })}
    <button type="button" {...props}>Dates</button>
  {/snippet}
</DateRangePopover>

<button type="button" onclick={() => (open = true)}>Open</button>
