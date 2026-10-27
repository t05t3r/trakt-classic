<script lang="ts">
  import PendingSpinner from '$lib/components/feedback/PendingSpinner.svelte';
  import type { QuickIconProps } from './QuickIconProps.ts';

  const {
    action,
    icon: Glyph,
    label,
    isSelected,
    isPending = false,
    isInert = false,
    onclick,
    ...rest
  }: QuickIconProps = $props();

  const handleClick: QuickIconProps['onclick'] = (event) => {
    if (isInert) return;

    onclick?.(event);
  };
</script>

<!-- After the spread, so a `Menu`'s untyped trigger props cannot override them. -->
<button
  {...rest}
  type="button"
  class="trakt-quick-icon"
  data-action={action}
  class:is-selected={isSelected}
  aria-label={label}
  aria-busy={isPending}
  aria-disabled={isInert}
  onclick={handleClick}
>
  {#if isPending}
    <PendingSpinner />
  {:else}
    <Glyph class="quick-icon-glyph" aria-hidden="true" />
  {/if}
</button>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  // `QuickActions` sets the slot and glyph sizes for its strip size.
  .trakt-quick-icon {
    --quick-icon-color: var(--color-action-watch);
    --pending-spinner-size: var(--quick-icon-glyph-size);
    --pending-spinner-stroke: var(--icon-stroke-strip);

    display: grid;
    place-items: center;
    width: var(--quick-icon-slot-width);
    height: var(--quick-icon-slot-height);
    padding: var(--ni-0);
    border: none;
    background: transparent;
    color: var(--quick-icon-color);
    cursor: pointer;
    transition:
      background var(--transition-default),
      color var(--transition-default);

    &[data-action='list'] {
      --quick-icon-color: var(--color-action-list);
    }

    &[data-action='favorite'] {
      --quick-icon-color: var(--color-action-favorite);
    }

    // Drawn inside the box, so a strip at the viewport's edge keeps the ring on screen.
    &:focus-visible {
      outline-offset: var(--ni-neg-1);
    }

    &.is-selected {
      background: var(--quick-icon-color);
      color: var(--color-text-primary);
    }

    @include for-mouse {
      &:hover {
        background: var(--quick-icon-color);
        color: var(--color-text-primary);
      }
    }

    :global(.quick-icon-glyph) {
      width: var(--quick-icon-glyph-size);
      height: var(--quick-icon-glyph-size);
      stroke-width: var(--icon-stroke-strip);
    }

    &[data-action='favorite'] :global(.quick-icon-glyph) {
      width: var(--quick-icon-star-size);
      height: var(--quick-icon-star-size);
    }
  }
</style>
