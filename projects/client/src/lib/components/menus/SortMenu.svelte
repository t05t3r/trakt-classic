<script lang="ts" generics="K extends string">
  import * as m from '$lib/features/i18n/messages.ts';
  import ChoiceMenu from './ChoiceMenu.svelte';
  import type { SortMenuProps } from './_internal/SortMenuProps.ts';

  const {
    value,
    choices,
    onSelect,
    onRepick,
    font,
    changed,
  }: SortMenuProps<K> = $props();
</script>

<ChoiceMenu
  label={m.label_sort_by()}
  triggerLabel={(sort) => m.button_label_sort_by({ sort })}
  {value}
  {choices}
  onChange={onSelect}
  {onRepick}
  {font}
  {changed}
/>
