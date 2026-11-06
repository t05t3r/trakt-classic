<script lang="ts">
  import ActionSideIcon from '$lib/components/buttons/ActionSideIcon.svelte';
  import DateTimePopover from '$lib/components/forms/DateTimePopover.svelte';
  import Menu from '$lib/components/menus/Menu.svelte';
  import MenuItem from '$lib/components/menus/MenuItem.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import type { MarkAsWatchedAt } from '$lib/models/MarkAsWatchedAt.ts';
  import IconCirclePlus from '@tabler/icons-svelte/icons/circle-plus';
  import type { Attachment } from 'svelte/attachments';

  const { onAdd }: { onAdd: (at: Exclude<MarkAsWatchedAt, 'unknown'>) => void } =
    $props();

  let control = $state<HTMLElement>();
  let isFieldOpen = $state(false);

  const holdControl: Attachment<HTMLElement> = (element) => {
    control = element;
  };
</script>

<Menu label={m.label_mark_as_watched_at()} align="end" isInert={isFieldOpen}>
  {#snippet trigger({ props })}
    <ActionSideIcon
      icon={IconCirclePlus}
      label={m.button_label_add_play()}
      {...props}
      {@attach holdControl}
    />
  {/snippet}

  <MenuItem onSelect={() => onAdd('now')}>
    {m.button_text_mark_as_watched_now()}
  </MenuItem>
  <MenuItem onSelect={() => onAdd('released')}>
    {m.button_text_mark_as_watched_release_date()}
  </MenuItem>
  <MenuItem onSelect={() => (isFieldOpen = true)}>
    {m.button_text_other_date()}
  </MenuItem>
</Menu>

<DateTimePopover
  label={m.label_mark_as_watched_at()}
  anchor={control}
  onApply={onAdd}
  bind:open={isFieldOpen}
/>
