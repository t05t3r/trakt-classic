<script lang="ts">
  import { mergeProps, Tooltip } from "bits-ui";
  import type { TooltipProps } from "./TooltipProps";

  const {
    trigger,
    triggerProps,
    content,
    variant = "default",
    side = "top",
    delayDuration = 150,
    sideOffset = 8,
    disabled = false,
    disableHoverableContent = false,
    keepOpenOnPress = false,
  }: TooltipProps = $props();
  // The content drops its own id, so the tooltip element carries the one the
  // trigger's aria-describedby reads.
  const id = $props.id();

  const tooltipClass = $derived(
    variant === "compact" ? "trakt-tooltip-compact" : "trakt-tooltip",
  );
</script>

<Tooltip.Provider>
  <Tooltip.Root
    {delayDuration}
    disabled={disabled ?? false}
    {disableHoverableContent}
    disableCloseOnTriggerClick={keepOpenOnPress}
    ignoreNonKeyboardFocus
  >
    <Tooltip.Trigger>
      {#snippet child({ props })}
        <!-- Tooltip first, so a trigger's preventDefault cannot skip it and the trigger's attributes win. -->
        {@render trigger({ props: mergeProps(props, triggerProps) })}
      {/snippet}
    </Tooltip.Trigger>
    <Tooltip.Portal>
      <Tooltip.Content {id} class={tooltipClass} {side} {sideOffset}>
        {#snippet child({ wrapperProps, props })}
          <div {...wrapperProps}>
            <div {...props} {id}>
              {#if typeof content === "function"}
                {@render content()}
              {:else if variant === "default"}
                <p>{content}</p>
              {:else}
                {content}
              {/if}
            </div>
          </div>
        {/snippet}
      </Tooltip.Content>
    </Tooltip.Portal>
  </Tooltip.Root>
</Tooltip.Provider>

<style>
  :global(.trakt-tooltip) {
    z-index: var(--layer-top);
    max-width: var(--ni-276);

    background-color: var(--color-tooltip-background);
    color: var(--color-tooltip-text);
    text-align: center;

    border: var(--ni-1) solid var(--color-border);
    border-radius: var(--border-radius-m);
    padding: var(--ni-10);

    box-shadow: var(--shadow-menu);
  }

  :global(.trakt-tooltip-compact) {
    z-index: var(--layer-top);

    white-space: nowrap;

    background-color: var(--color-tooltip-background);
    color: var(--color-tooltip-text);

    font-size: var(--ni-12);
    line-height: 1;
    font-weight: 500;

    border-radius: var(--border-radius-xs);
    padding: var(--ni-6) var(--ni-8);

    box-shadow: var(--shadow-menu);
  }
</style>
