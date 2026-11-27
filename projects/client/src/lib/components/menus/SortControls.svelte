<script lang="ts" generics="K extends string">
  import SortDirectionToggle from '$lib/components/buttons/SortDirectionToggle.svelte';
  import SortMenu from './SortMenu.svelte';
  import type { SortControlsProps } from './_internal/SortControlsProps.ts';

  const {
    value,
    choices,
    onSelect,
    onRepick,
    pressed,
    onReverse,
    toggles,
    size,
    changed,
  }: SortControlsProps<K> = $props();
</script>

<div class="trakt-sort-controls">
  <SortMenu {value} {choices} {onSelect} {onRepick} font={size} {changed} />
  <div class="toolbar-toggles">
    <span class="toolbar-direction">
      <SortDirectionToggle {pressed} onToggle={onReverse} {size} />
    </span>
    {@render toggles?.()}
  </div>
</div>

<style lang="scss">
  .trakt-sort-controls {
    display: flex;
    align-items: center;

    .toolbar-toggles {
      display: flex;
      align-items: center;
      gap: var(--icon-button-gap);
    }

    .toolbar-direction {
      display: inline-flex;
      margin-inline-start: var(--ni-4);
    }
  }
</style>
