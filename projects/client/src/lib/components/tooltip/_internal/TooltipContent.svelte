<script lang="ts">
  import { Tooltip } from 'bits-ui';
  import TooltipDetail from '../TooltipDetail.svelte';
  import type { TooltipContentProps } from './TooltipContentProps.ts';

  const { id, content, detail, side = 'top' }: TooltipContentProps = $props();
</script>

<Tooltip.Portal>
  <!-- Deferring, so an open popover under it still closes on a press outside. -->
  <Tooltip.Content
    {id}
    class="trakt-tooltip"
    {side}
    sideOffset={8}
    interactOutsideBehavior="defer-otherwise-close"
  >
    {#snippet child({ wrapperProps, props })}
      <div {...wrapperProps}>
        <!-- The content drops its own id, so the tooltip element carries the one the trigger's aria-describedby reads. -->
        <div {...props} {id}>
          {#if typeof content === "function"}
            {@render content()}
          {:else}
            <p>{content}</p>
          {/if}
          {#if detail}
            <TooltipDetail text={detail} />
          {/if}
          <Tooltip.Arrow>
            {#snippet child({ props: arrowProps })}
              <span {...arrowProps} class="tooltip-arrow"></span>
            {/snippet}
          </Tooltip.Arrow>
        </div>
      </div>
    {/snippet}
  </Tooltip.Content>
</Tooltip.Portal>

<style>
  :global(.trakt-tooltip) {
    position: relative;
    z-index: var(--layer-top);
    max-width: var(--ni-276);

    background-color: var(--color-tooltip-background);
    color: var(--color-tooltip-text);
    text-align: center;

    border: var(--ni-1) solid var(--color-border);
    border-radius: var(--tooltip-radius);
    padding: var(--tooltip-padding);

    box-shadow: var(--shadow-menu);
  }

  /* bits-ui turns this downward triangle to face the trigger on either side. */
  :global(.trakt-tooltip .tooltip-arrow) {
    width: 0;
    height: 0;

    border-style: solid;
    border-color: transparent;
    border-width: var(--tooltip-arrow-size) var(--tooltip-arrow-size) 0;
    border-block-start-color: var(--color-border);
  }

  /* The fill sits inside the border triangle, one border width short of its tip. */
  :global(.trakt-tooltip .tooltip-arrow::after) {
    content: "";
    position: absolute;
    inset-block-end: var(--ni-1);
    left: 50%;
    transform: translateX(-50%);

    border-style: solid;
    border-color: transparent;
    border-width: calc(var(--tooltip-arrow-size) - var(--ni-1))
      calc(var(--tooltip-arrow-size) - var(--ni-1)) 0;
    border-block-start-color: var(--color-tooltip-background);
  }
</style>
