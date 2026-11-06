<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import ActionSideIcon from '$lib/components/buttons/ActionSideIcon.svelte';
  import DateTimePopover from '$lib/components/forms/DateTimePopover.svelte';
  import Menu from '$lib/components/menus/Menu.svelte';
  import MenuItem from '$lib/components/menus/MenuItem.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import { NOOP_FN } from '$lib/utils/NOOP_FN.ts';
  import { createFocusRetention } from '$lib/utils/focus/createFocusRetention.ts';
  import { createPressHold } from '$lib/utils/focus/createPressHold.ts';
  import { firstFocusable } from '$lib/utils/focus/firstFocusable.ts';
  import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';
  import IconDots from '@tabler/icons-svelte/icons/dots';
  import type { Attachment } from 'svelte/attachments';
  import type { MoreActionsMenuProps } from './MoreActionsMenuProps.ts';

  const { target, hasHistory, onDrop, onRestore }: MoreActionsMenuProps =
    $props();

  const hasRows = $derived(hasHistory || !!onDrop || !!onRestore);

  const retention = createFocusRetention();
  const pressHold = createPressHold();
  let control = $state<HTMLElement>();
  let isFieldOpen = $state(false);
  let strip: HTMLElement | null = null;

  const holdControl: Attachment<HTMLElement> = (element) => {
    control = element;
    strip = element.parentElement;

    return () => {
      if (control === element) control = undefined;
    };
  };

  // The field writes through onDrop, so it has nothing left to apply without it.
  $effect(() => {
    if (!onDrop) isFieldOpen = false;
  });

  // A restore that ends lets go, so a later emptying leaves focus alone.
  const pressRestore = (restore: () => Promise<unknown>) => () =>
    pressHold.press(control, restore);

  // Restoring a show with no Play empties the menu, so the strip's first control takes its focus.
  $effect(() => {
    if (hasRows) return;
    const pressedControl = pressHold.take();
    if (!pressedControl) return;

    retention.remember(pressedControl);
    retention.settle(strip && firstFocusable(strip));
  });

  // The row fires and forgets, so a failed push settles quietly.
  const openHistory = () =>
    goto(resolve(UrlBuilder.history.item(target))).catch(NOOP_FN);
</script>

{#if hasRows}
  <Menu
    label={m.button_label_more_actions()}
    align="end"
    isInert={isFieldOpen}
  >
    {#snippet trigger({ props })}
      <ActionSideIcon
        icon={IconDots}
        label={m.button_label_more_actions()}
        {...props}
        {@attach holdControl}
      />
    {/snippet}

    {#if hasHistory}
      <MenuItem onSelect={openHistory}>
        {m.button_text_view_history()}
      </MenuItem>
    {/if}
    {#if onDrop}
      <MenuItem onSelect={() => (isFieldOpen = true)}>
        {m.button_text_drop_show()}
      </MenuItem>
    {/if}
    {#if onRestore}
      <MenuItem onSelect={pressRestore(onRestore)}>
        {m.button_text_restore_show()}
      </MenuItem>
    {/if}
  </Menu>
{/if}

<DateTimePopover
  label={m.label_drop_show_at()}
  anchor={control}
  onApply={(at) => onDrop?.(at)}
  bind:open={isFieldOpen}
/>
