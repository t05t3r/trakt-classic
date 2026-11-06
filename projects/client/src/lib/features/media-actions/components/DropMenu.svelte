<script lang="ts">
  import DateTimePopover from '$lib/components/forms/DateTimePopover.svelte';
  import { INERT_TRIGGER_PROPS } from '$lib/components/menus/INERT_TRIGGER_PROPS.ts';
  import Menu from '$lib/components/menus/Menu.svelte';
  import MenuItem from '$lib/components/menus/MenuItem.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import { useDrop } from '$lib/features/media-actions/stores/useDrop.ts';
  import { createFocusRetention } from '$lib/utils/focus/createFocusRetention.ts';
  import { createPressHold } from '$lib/utils/focus/createPressHold.ts';
  import IconCircleMinus from '@tabler/icons-svelte/icons/circle-minus';
  import IconPlayerTrackPrev from '@tabler/icons-svelte/icons/player-track-prev';
  import { createAttachmentKey, type Attachment } from 'svelte/attachments';
  import type { DropMenuProps } from './_internal/DropMenuProps.ts';

  const HOLD_FOCUS = createAttachmentKey();

  const { show }: DropMenuProps = $props();
  // A new show needs a new menu, so this store serves the menu's whole life.
  // svelte-ignore state_referenced_locally
  const { isDropped, isUpdating, drop, restore } = useDrop(show);

  const retention = createFocusRetention();
  const pressHold = createPressHold();
  let control = $state<HTMLElement>();
  let isFieldOpen = $state(false);

  // A press swaps Drop and Restore, and a write that fails or is ignored swaps them back,
  // so the control that comes in takes the focus of the one that left.
  const holdFocusAcrossSwap: Attachment<HTMLElement> = (element) => {
    control = element;
    const pressedControl = pressHold.take(element);
    if (pressedControl) retention.remember(pressedControl);
    const untrack = retention.track(element);
    retention.settle(element);

    return () => {
      untrack();
      if (control === element) control = undefined;
    };
  };

  const withFocusHold = (props: Record<string, unknown>) => ({
    ...props,
    [HOLD_FOCUS]: holdFocusAcrossSwap,
  });

  // An action that ends with no swap lets go, so a later swap leaves focus alone.
  const pressed = (action: () => Promise<unknown>) => () =>
    pressHold.press(control, action);

  // Unknown or saving, a press would act on a state the viewer cannot see yet.
  const isInert = $derived($isDropped === undefined || $isUpdating);
  // The field writes a drop, which a dropped show or a state the viewer cannot see yet takes away.
  $effect(() => {
    if (isFieldOpen && ($isDropped || isInert)) isFieldOpen = false;
  });

  const restoreProps = $derived(
    withFocusHold(
      isInert
        ? INERT_TRIGGER_PROPS
        : { onclick: pressed(restore) },
    ),
  );
</script>

{#snippet iconButton({
  props,
  label,
  glyph: Glyph,
}: {
  props: Record<string, unknown>;
  label: string;
  glyph: typeof IconCircleMinus;
})}
  <!-- After the spread, so the menu's untyped trigger props cannot override them. -->
  <button
    {...props}
    type="button"
    class="trakt-drop-menu"
    title={label}
    aria-label={label}
  >
    <Glyph class="drop-menu-glyph" aria-hidden="true" />
  </button>
{/snippet}

{#snippet dropButton({ props }: { props: Record<string, unknown> })}
  {@render iconButton({
    props,
    label: m.button_label_drop_show({ title: show.title }),
    glyph: IconCircleMinus,
  })}
{/snippet}

{#snippet restoreButton({ props }: { props: Record<string, unknown> })}
  {@render iconButton({
    props,
    label: m.button_label_restore_show({ title: show.title }),
    glyph: IconPlayerTrackPrev,
  })}
{/snippet}

{#if $isDropped}
  {@render restoreButton({ props: restoreProps })}
{:else}
  <Menu label={m.label_drop_show_at()} isInert={isInert || isFieldOpen}>
    {#snippet trigger({ props })}
      {@render dropButton({ props: withFocusHold(props) })}
    {/snippet}

    <MenuItem onSelect={pressed(drop)}>
      {m.button_text_drop_show_now()}
    </MenuItem>
    <MenuItem onSelect={() => (isFieldOpen = true)}>
      {m.button_text_other_date()}
    </MenuItem>
  </Menu>
{/if}

<DateTimePopover
  label={m.label_drop_show_at()}
  anchor={control}
  onApply={(at) => pressHold.press(control, () => drop(at))}
  bind:open={isFieldOpen}
/>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-drop-menu {
    display: inline-flex;
    flex-shrink: 0;
    margin-inline-end: var(--ni-5);
    padding: var(--ni-0);
    border: none;
    background: none;
    color: var(--color-text-help);
    cursor: pointer;
    transition: color var(--transition-default);

    :global(.drop-menu-glyph) {
      width: var(--icon-size-title-row);
      height: var(--icon-size-title-row);
      stroke-width: var(--icon-stroke-chrome);
    }

    @include for-mouse {
      &:hover {
        color: var(--color-text-primary);
      }
    }
  }
</style>
