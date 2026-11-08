<script lang="ts">
  import { FOCUSABLE_CONTROLS } from '$lib/utils/focus/FOCUSABLE_CONTROLS.ts';
  import { getDocumentDirection } from '$lib/utils/intl/getDocumentDirection.ts';
  import { Popover } from 'bits-ui';
  import type { PopoverProps } from './_internal/PopoverProps.ts';
  import { holdOpenMenu } from './openMenus.ts';

  let {
    label,
    trigger,
    anchor,
    children,
    side = 'bottom',
    variant = 'default',
    open = $bindable(false),
  }: PopoverProps = $props();
  // The content drops its own id, so the dialog carries the one the trigger's aria-controls names.
  const id = $props.id();

  let triggerRef = $state<HTMLElement | null>(null);
  let contentRef = $state<HTMLElement | null>(null);
  let pressedControl: HTMLElement | null = null;
  let pressPointer = '';

  // Read at the close, since the parent's anchor follows its current control.
  const ownControl = $derived(anchor ?? triggerRef);

  // The cleanup releases the hold on a close and on a destroy while open.
  $effect(() => {
    if (trigger || !open || !anchor) return;

    return holdOpenMenu({
      trigger: anchor,
      contains: (node) => !!contentRef?.contains(node),
      close: () => (open = false),
    });
  });

  // The target says what was pressed, since Safari does not focus a pressed button.
  const otherControlAt = (target: EventTarget | null) => {
    if (!(target instanceof Element) || ownControl?.contains(target)) {
      return null;
    }
    return target.closest<HTMLElement>(FOCUSABLE_CONTROLS);
  };

  // Out of the tab order, so not a control the close hands the focus to, yet a press still focuses it.
  const takesFocusOnly = (target: EventTarget | null) =>
    target instanceof Element && !!target.closest('[tabindex="-1"]');

  const notePressPointer = ({ pointerType }: PointerEvent) => {
    pressPointer = pointerType;
  };

  // Chromium scrolls a date input the trap pulls the focus back to, even with preventScroll,
  // so a mouse press on another control doesn't move the focus: the close hands it over.
  const holdFocusThroughPress = (event: MouseEvent) => {
    if (pressPointer !== 'mouse') return;
    if (event.target instanceof Node && contentRef?.contains(event.target)) {
      return;
    }
    if (otherControlAt(event.target) || takesFocusOnly(event.target)) {
      event.preventDefault();
    }
  };

  $effect(() => {
    if (!open) return;

    document.addEventListener('pointerdown', notePressPointer, true);
    document.addEventListener('mousedown', holdFocusThroughPress, true);

    return () => {
      document.removeEventListener('pointerdown', notePressPointer, true);
      document.removeEventListener('mousedown', holdFocusThroughPress, true);
    };
  });

  const handleOutsidePress = ({ target }: PointerEvent) => {
    pressedControl = otherControlAt(target);
    // bits-ui leaves a press on the anchor to a trigger, and here there is none.
    if (!trigger) open = false;
  };

  // The trap can hold the focus in the content through a press, so that is not taken.
  const isFocusTaken = () => {
    const active = document.activeElement;
    return !!active && active !== document.body &&
      !contentRef?.contains(active);
  };

  const returnFocus = (event: Event) => {
    event.preventDefault();
    const pressed = pressedControl;
    pressedControl = null;
    // A menu the press opened may already hold the focus.
    if (pressed && isFocusTaken()) return;
    (pressed ?? ownControl)?.focus({ preventScroll: true });
  };
</script>

<Popover.Root bind:open>
  {#if trigger}
    <Popover.Trigger bind:ref={triggerRef}>
      {#snippet child({ props })}
        {@render trigger({ props })}
      {/snippet}
    </Popover.Trigger>
  {/if}
  <Popover.Portal>
    <!-- The arrow's base sits on the box's border, so its height overshoots the gap by that border. -->
    <Popover.Content
      bind:ref={contentRef}
      {id}
      {side}
      sideOffset={-1}
      dir={getDocumentDirection()}
      customAnchor={anchor}
      onInteractOutside={handleOutsidePress}
      onCloseAutoFocus={returnFocus}
    >
      {#snippet child({ wrapperProps, props })}
        <div {...wrapperProps}>
          <div
            {...props}
            {id}
            class="trakt-popover"
            data-variant={variant}
            role="dialog"
            aria-label={label}
          >
            {@render children()}
            <Popover.Arrow>
              {#snippet child({ props: arrowProps })}
                <span {...arrowProps} class="popover-arrow"></span>
              {/snippet}
            </Popover.Arrow>
          </div>
        </div>
      {/snippet}
    </Popover.Content>
  </Popover.Portal>
</Popover.Root>

<style lang="scss">
  :global(.trakt-popover) {
    position: relative;
    box-sizing: border-box;
    max-width: var(--popover-width);
    padding: var(--popover-padding-block) var(--popover-padding-inline);
    z-index: var(--layer-menu);

    border: var(--ni-1) solid var(--color-popover-border);
    background: var(--color-surface-menu);
    box-shadow: var(--shadow-popover);
  }

  :global(.trakt-popover[data-variant='flush']) {
    inline-size: var(--popover-width);
    padding: var(--ni-0);
  }

  // bits-ui turns this downward triangle to face the trigger on either side.
  :global(.trakt-popover .popover-arrow) {
    width: 0;
    height: 0;

    border-style: solid;
    border-color: transparent;
    border-width: var(--popover-arrow-size) var(--popover-arrow-size) 0;
    border-block-start-color: var(--color-popover-arrow-border);
  }

  :global(.trakt-popover .popover-arrow::after) {
    content: '';
    position: absolute;
    inset-block-end: calc(
      var(--popover-arrow-size) - var(--popover-arrow-fill-size)
    );
    left: 50%;
    transform: translateX(-50%);

    border-style: solid;
    border-color: transparent;
    border-width: var(--popover-arrow-fill-size) var(--popover-arrow-fill-size)
      0;
    border-block-start-color: var(--color-surface-menu);
  }

  :global(.trakt-popover .popover-arrow[data-side='bottom']::after) {
    border-block-start-color: var(--color-popover-arrow-fill-bottom);
  }

  :global(.trakt-popover[data-variant='flush'] .popover-arrow[data-side='bottom']::after) {
    border-block-start-color: var(--color-surface-menu);
  }
</style>
