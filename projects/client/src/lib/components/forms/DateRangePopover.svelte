<script lang="ts">
  import MenuCheckboxRow from '$lib/components/menus/MenuCheckboxRow.svelte';
  import Popover from '$lib/components/menus/Popover.svelte';
  import type { DateRangeDays } from '$lib/models/DateRangeDays.ts';
  import type { DateRangePopoverProps } from './DateRangePopoverProps.ts';
  import DateRangeFields from './_internal/DateRangeFields.svelte';

  let {
    label,
    trigger,
    presets,
    value,
    onApply,
    onClear,
    open = $bindable(false),
  }: DateRangePopoverProps = $props();

  const active = $derived(
    presets.find((preset) =>
      preset.start === value.start && preset.end === value.end
    ),
  );

  const apply = (days: DateRangeDays) => {
    open = false;
    onApply(days);
  };

  const clear = () => {
    open = false;
    onClear();
  };
</script>

<Popover {label} {trigger} variant="flush" bind:open>
  <div class="trakt-date-range-popover">
    <div class="date-range-presets">
      {#each presets as preset (preset.key)}
        <MenuCheckboxRow
          role="button"
          checked={preset.key === active?.key}
          onToggle={() => apply({ start: preset.start, end: preset.end })}
        >
          {preset.label}
        </MenuCheckboxRow>
      {/each}
    </div>

    <hr class="date-range-divider" />

    <DateRangeFields {value} onApply={apply} onClear={clear} />
  </div>
</Popover>

<style lang="scss">
  .trakt-date-range-popover {
    color: var(--color-text-tertiary);

    .date-range-presets {
      padding-block: var(--ni-5);
    }

    .date-range-divider {
      margin-block: var(--ni-5);
      margin-inline: var(--ni-0);
      border: none;
      border-block-start: var(--ni-1) solid var(--divider-rule);
    }
  }
</style>
