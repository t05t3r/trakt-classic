<script lang="ts">
  import DropdownButton from '$lib/components/buttons/DropdownButton.svelte';
  import DateTimePopover from '$lib/components/forms/DateTimePopover.svelte';
  import { INERT_TRIGGER_PROPS } from '$lib/components/menus/INERT_TRIGGER_PROPS.ts';
  import Menu from '$lib/components/menus/Menu.svelte';
  import MenuItem from '$lib/components/menus/MenuItem.svelte';
  import { hint } from '$lib/components/tooltip/hint.svelte.ts';
  import * as m from '$lib/features/i18n/messages.ts';
  import { useDrop } from '$lib/features/media-actions/stores/useDrop.ts';
  import { createFocusRetention } from '$lib/utils/focus/createFocusRetention.ts';
  import { createPressHold } from '$lib/utils/focus/createPressHold.ts';
  import { toHumanPatternDate } from '$lib/utils/formatting/date/toHumanPatternDate.ts';
  import { useHydrated } from '$lib/utils/hydration/hydration.ts';
  import { NOOP_FN } from '$lib/utils/NOOP_FN.ts';
  import IconCircleMinus from '@tabler/icons-svelte/icons/circle-minus';
  import IconPlayerTrackPrev from '@tabler/icons-svelte/icons/player-track-prev';
  import type { Attachment } from 'svelte/attachments';
  import type { DropMenuProps } from './_internal/DropMenuProps.ts';

  const { show, variant = 'card', status, describedBy }: DropMenuProps =
    $props();
  // A new show needs a new menu, so this store serves the menu's whole life.
  // svelte-ignore state_referenced_locally
  const { isDropped, isUpdating, drop, restore } = useDrop(show);
  const hydrated = useHydrated();

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
    isInert ? INERT_TRIGGER_PROPS : { onclick: pressed(restore) },
  );
  const openField = (): void => {
    isFieldOpen = true;
  };
  let isClosingPress = false;
  // The field has closed by the time its press's click lands.
  const noteClosingPress = () => {
    isClosingPress = isFieldOpen;
  };
  // A click from the keyboard, whose detail is 0, has no press of its own.
  const openFieldByClick = ({ detail }: MouseEvent) => {
    if (detail === 0 || !isClosingPress) openField();
  };
  const dropProps = $derived.by(() => {
    if (isInert) return INERT_TRIGGER_PROPS;

    return {
      ...(isFieldOpen ? INERT_TRIGGER_PROPS : { onclick: openFieldByClick }),
      onpointerdown: noteClosingPress,
    };
  });

  const statusKind = $derived.by(() => {
    if ($isDropped) return 'dropped';
    return status?.isComplete ? 'caught-up' : 'watching';
  });
  // The day reads the viewer's zone, which the server cannot know.
  const droppedOn = $derived($hydrated ? status?.droppedAt : undefined);
  const statusLabel = $derived.by(() => {
    if (statusKind === 'watching') return m.text_progress_status_watching();
    if (statusKind === 'caught-up') return m.text_progress_status_caught_up();
    if (!droppedOn) return m.text_progress_status_dropped();
    return m.text_progress_status_dropped_on({
      date: toHumanPatternDate(droppedOn, 'd MMM yyyy'),
    });
  });
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
  <button
    {...props}
    type="button"
    class="trakt-drop-menu"
    aria-label={label}
    {@attach holdFocusAcrossSwap}
    {@attach hint(() => ({ content: label, isPassThrough: true }))}
  >
    <Glyph class="drop-menu-glyph" aria-hidden="true" />
  </button>
{/snippet}

{#snippet statusDot()}
  <span
    class="drop-menu-status-dot"
    data-status={statusKind}
    aria-hidden="true"
  ></span>
{/snippet}

{#snippet dropGlyph()}<IconCircleMinus />{/snippet}
{#snippet undropGlyph()}<IconPlayerTrackPrev />{/snippet}

{#if variant === 'status'}
  <Menu label={statusLabel} isInert={isInert || isFieldOpen}>
    {#snippet trigger({ props })}
      <DropdownButton
        {...props}
        label={statusLabel}
        glyph={statusDot}
        aria-describedby={describedBy}
        {@attach holdFocusAcrossSwap}
      >
        {statusLabel}
      </DropdownButton>
    {/snippet}

    <MenuItem checked glyph={statusDot} onSelect={NOOP_FN}>
      {statusLabel}
    </MenuItem>
    {#if $isDropped}
      <MenuItem glyph={undropGlyph} onSelect={pressed(restore)}>
        {m.button_text_undrop()}
      </MenuItem>
    {:else}
      <MenuItem glyph={dropGlyph} onSelect={openField}>
        {m.button_text_drop()}
      </MenuItem>
    {/if}
  </Menu>
{:else if $isDropped}
  {@render iconButton({
    props: restoreProps,
    label: m.button_label_restore_show({ title: show.title }),
    glyph: IconPlayerTrackPrev,
  })}
{:else}
  {@render iconButton({
    props: {
      ...dropProps,
      'aria-haspopup': 'dialog',
      'aria-expanded': isFieldOpen,
    },
    label: m.button_label_drop_show({ title: show.title }),
    glyph: IconCircleMinus,
  })}
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

  .drop-menu-status-dot {
    flex-shrink: 0;
    width: var(--ni-8);
    height: var(--ni-8);
    border-radius: var(--border-radius-round);
    background: var(--color-success);

    &[data-status='caught-up'] {
      background: var(--color-text-muted);
    }

    &[data-status='dropped'] {
      background: var(--color-danger);
    }
  }
</style>
