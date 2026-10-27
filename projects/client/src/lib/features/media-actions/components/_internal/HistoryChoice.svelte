<script lang="ts">
  import ActionSideIcon from '$lib/components/buttons/ActionSideIcon.svelte';
  import Menu from '$lib/components/menus/Menu.svelte';
  import MenuItem from '$lib/components/menus/MenuItem.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import type { MarkAsWatchedAt } from '$lib/models/MarkAsWatchedAt.ts';
  import IconCirclePlus from '@tabler/icons-svelte/icons/circle-plus';

  const {
    onAdd,
  }: { onAdd: (at: Extract<MarkAsWatchedAt, 'now' | 'released'>) => void } =
    $props();
</script>

<Menu label={m.label_mark_as_watched_at()} align="end">
  {#snippet trigger({ props })}
    <ActionSideIcon
      icon={IconCirclePlus}
      label={m.button_label_add_play()}
      {...props}
    />
  {/snippet}

  <MenuItem onSelect={() => onAdd('now')}>
    {m.button_text_mark_as_watched_now()}
  </MenuItem>
  <MenuItem onSelect={() => onAdd('released')}>
    {m.button_text_mark_as_watched_release_date()}
  </MenuItem>
</Menu>
