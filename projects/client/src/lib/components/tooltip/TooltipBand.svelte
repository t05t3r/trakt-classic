<script lang="ts">
  import type { TooltipBandProps } from './TooltipBandProps.ts';

  const { edge, fill = 'edge', children }: TooltipBandProps = $props();
</script>

<div class="trakt-tooltip-band" data-edge={edge} data-fill={fill}>
  {@render children()}
</div>

<style lang="scss">
  // The band runs the tooltip's full width, past its padding.
  .trakt-tooltip-band {
    align-self: stretch;
    margin-inline: var(--tooltip-neg-padding);
    padding: var(--tooltip-padding);
    color: var(--color-tooltip-text);

    &[data-edge='start'] {
      margin-block-start: var(--tooltip-neg-padding);
      border-block-end: var(--ni-1) solid var(--color-border);
      border-start-start-radius: var(--tooltip-radius);
      border-start-end-radius: var(--tooltip-radius);
      background-color: var(--color-surface-raised);
    }

    &[data-edge='end'] {
      margin-block-end: var(--tooltip-neg-padding);
      border-block-start: var(--ni-1) solid var(--color-border);
      border-end-start-radius: var(--tooltip-radius);
      border-end-end-radius: var(--tooltip-radius);
      background-color: var(--color-tooltip-band-sunken);
    }

    &[data-fill='none'] {
      background-color: transparent;
    }
  }
</style>
