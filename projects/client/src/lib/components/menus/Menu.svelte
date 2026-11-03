<script lang="ts">
  import { getDocumentDirection } from '$lib/utils/intl/getDocumentDirection.ts';
  import { DropdownMenu } from 'bits-ui';
  import type { MenuProps } from './_internal/MenuProps.ts';
  import { INERT_TRIGGER_PROPS } from './INERT_TRIGGER_PROPS.ts';
  import { holdOpenMenu } from './openMenus.ts';

  const {
    label,
    trigger,
    children,
    align = 'start',
    isInert = false,
    isLimited = false,
  }: MenuProps = $props();
  // The content drops its own id, so the menu element carries the one the
  // trigger's aria-controls names.
  const id = $props.id();
  const dir = getDocumentDirection();

  let open = $state(false);
  let triggerRef = $state<HTMLElement | null>(null);
  let contentRef = $state<HTMLElement | null>(null);
  let closedOutside = false;

  // The cleanup releases the hold on a close and on a destroy while open.
  $effect(() => {
    if (!open || !triggerRef) return;

    return holdOpenMenu({
      trigger: triggerRef,
      contains: (node) => !!contentRef?.contains(node),
      close: () => (open = false),
    });
  });

  // bits-ui returns focus to the trigger after every close but an outside one.
  const returnFocusAfterOutsideClose = (event: Event) => {
    if (!closedOutside) return;
    closedOutside = false;
    event.preventDefault();
    triggerRef?.focus({ preventScroll: true });
  };
</script>

<DropdownMenu.Root bind:open {dir}>
  <DropdownMenu.Trigger bind:ref={triggerRef}>
    {#snippet child({ props })}
      {@render trigger({
        props: isInert && !open ? { ...props, ...INERT_TRIGGER_PROPS } : props,
      })}
    {/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Portal>
    <DropdownMenu.Content
      bind:ref={contentRef}
      {id}
      class="trakt-menu"
      aria-label={label}
      {align}
      {dir}
      data-limited={isLimited || undefined}
      onInteractOutside={() => (closedOutside = true)}
      onCloseAutoFocus={returnFocusAfterOutsideClose}
    >
      {#snippet child({ wrapperProps, props })}
        <div {...wrapperProps}>
          <div {...props} {id}>
            {@render children()}
          </div>
        </div>
      {/snippet}
    </DropdownMenu.Content>
  </DropdownMenu.Portal>
</DropdownMenu.Root>

<style lang="scss">
  :global(.trakt-menu) {
    // The available height leaves out the gap margin toward the trigger.
    --menu-available-height: calc(
      var(--bits-dropdown-menu-content-available-height) - var(--ni-2)
    );

    box-sizing: border-box;
    min-width: var(--dropdown-min-width);
    max-height: var(--menu-available-height);
    overflow-y: auto;
    padding-block: var(--ni-5);
    z-index: var(--layer-menu);

    border: var(--ni-1) solid var(--color-border-strong);
    background: var(--color-surface-menu);
    color: var(--color-text-tertiary);
    box-shadow: var(--shadow-dropdown);
  }

  :global(.trakt-menu[data-limited]) {
    max-height: min(
      var(--menu-available-height),
      var(--dropdown-limit-height)
    );
  }

  :global(.trakt-menu[data-side='bottom']) {
    margin-block-start: var(--ni-2);
  }

  :global(.trakt-menu[data-side='top']) {
    margin-block-end: var(--ni-2);
  }
</style>
