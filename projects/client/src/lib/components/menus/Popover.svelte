<script lang="ts">
  import { Popover } from 'bits-ui';
  import type { PopoverProps } from './_internal/PopoverProps.ts';

  let {
    label,
    trigger,
    children,
    side = 'bottom',
    open = $bindable(false),
  }: PopoverProps = $props();
  // The content drops its own id, so the dialog carries the one the trigger's aria-controls names.
  const id = $props.id();
</script>

<Popover.Root bind:open>
  <Popover.Trigger>
    {#snippet child({ props })}
      {@render trigger({ props })}
    {/snippet}
  </Popover.Trigger>
  <Popover.Portal>
    <!-- The arrow's base sits on the box's border, so its height overshoots the gap by that border. -->
    <Popover.Content {id} {side} sideOffset={-1}>
      {#snippet child({ wrapperProps, props })}
        <div {...wrapperProps}>
          <div
            {...props}
            {id}
            class="trakt-popover"
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
</style>
