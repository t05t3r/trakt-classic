<script lang="ts">
  import ChoiceMenu from '$lib/components/menus/ChoiceMenu.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import { NOOP_FN } from '$lib/utils/NOOP_FN.ts';

  const { label }: { label: string } = $props();

  const VALUE = 'only';
</script>

<!-- Its one row is always checked, so the menu never reports a change. -->
<ChoiceMenu
  label={m.label_sort_by()}
  triggerLabel={(shown) => m.button_label_sort_by({ sort: shown })}
  value={VALUE}
  choices={[{ value: VALUE, label }]}
  onChange={NOOP_FN}
/>
