<script lang="ts" generics="K extends string">
  import ChoiceMenu from '$lib/components/menus/ChoiceMenu.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import { TYPE_LABELS } from './TYPE_LABELS.ts';
  import type { TypeMenuProps } from './TypeMenuProps.ts';

  const { value, choices, onChange, onRepick }: TypeMenuProps<K> = $props();
</script>

<ChoiceMenu
  label={m.label_list_type()}
  triggerLabel={(shown) => m.button_label_list_type({ type: shown })}
  {value}
  {choices}
  all={TYPE_LABELS.all()}
  {onChange}
  {onRepick}
/>
