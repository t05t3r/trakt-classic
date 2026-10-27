<script lang="ts">
  import { INERT_TRIGGER_PROPS } from '$lib/components/menus/INERT_TRIGGER_PROPS.ts';
  import Menu from '$lib/components/menus/Menu.svelte';
  import MenuItem from '$lib/components/menus/MenuItem.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import { useDrop } from '$lib/features/media-actions/stores/useDrop.ts';
  import { createFocusRetention } from '$lib/utils/focus/createFocusRetention.ts';
  import IconCircleMinus from '@tabler/icons-svelte/icons/circle-minus';
  import IconPlayerTrackPrev from '@tabler/icons-svelte/icons/player-track-prev';
  import { createAttachmentKey, type Attachment } from 'svelte/attachments';
  import type { DropMenuProps } from './_internal/DropMenuProps.ts';

  const HOLD_FOCUS = createAttachmentKey();

  const {
    show,
    trigger: dropTrigger = dropButton,
    restoreTrigger = restoreButton,
  }: DropMenuProps = $props();
  // A new show needs a new menu, so this store serves the menu's whole life.
  // svelte-ignore state_referenced_locally
  const { isDropped, isUpdating, drop, restore } = useDrop(show);

  const retention = createFocusRetention();
  let control: HTMLElement | undefined;
  let pressedControl: HTMLElement | undefined;

  // A press swaps Drop and Restore, and a write that fails or is ignored swaps them back,
  // so the control that comes in takes the focus of the one that left.
  const holdFocusAcrossSwap: Attachment<HTMLElement> = (element) => {
    control = element;
    if (pressedControl && pressedControl !== element) {
      retention.remember(pressedControl);
      pressedControl = undefined;
    }
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

  // Held from the press, since the menu or the confirm takes the focus first;
  // an action that ends with no swap lets it go, so a later swap leaves focus alone.
  const pressed = (action: () => Promise<unknown>) => () => {
    const press = control;
    pressedControl = press;
    void action().finally(() => {
      if (pressedControl === press) pressedControl = undefined;
    });
  };

  // Unknown or saving, a press would act on a state the viewer cannot see yet.
  const isInert = $derived($isDropped === undefined || $isUpdating);
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
  {@render restoreTrigger({ props: restoreProps })}
{:else}
  <Menu label={m.label_drop_show_at()} {isInert}>
    {#snippet trigger({ props })}
      {@render dropTrigger({ props: withFocusHold(props) })}
    {/snippet}

    <MenuItem onSelect={pressed(drop)}>
      {m.button_text_drop_show_now()}
    </MenuItem>
  </Menu>
{/if}

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
