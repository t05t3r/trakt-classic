<script lang="ts">
  import { isInertTrigger } from '$lib/components/menus/isInertTrigger.ts';
  import { hint } from '$lib/components/tooltip/hint.svelte.ts';
  import type { ActionSideIconProps } from './_internal/ActionSideIconProps.ts';

  const { icon: Glyph, label, disabled, ...rest }: ActionSideIconProps =
    $props();
</script>

<!-- A disabled or inert icon takes no input, so it shows no tooltip. -->
<!-- After the spread, so a `Menu`'s untyped trigger props cannot override them. -->
<button
  {...rest}
  type="button"
  class="trakt-action-side-icon"
  {disabled}
  aria-label={label}
  {@attach hint(() =>
    disabled || isInertTrigger(rest)
      ? undefined
      : { content: label, side: 'bottom', isPassThrough: true }
  )}
>
  <Glyph class="action-side-glyph" aria-hidden="true" />
</button>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  // `ActionButton` sets the colours except the strip's own hover background.
  .trakt-action-side-icon {
    display: grid;
    flex: 1;
    place-items: center;
    width: var(--action-button-side-width);
    padding: var(--ni-0);
    border: none;
    background: var(--action-side-background);
    color: var(--action-side-color);
    cursor: pointer;
    transition:
      background var(--transition-default),
      color var(--transition-default);

    :global(.action-side-glyph) {
      width: var(--icon-size-action-side);
      height: var(--icon-size-action-side);
      padding-inline: var(--ni-9) var(--ni-7);
      stroke-width: var(--icon-stroke-chrome);
      opacity: var(--action-side-icon-opacity);
      transition: opacity var(--transition-default);
    }

    &:focus-visible :global(.action-side-glyph) {
      opacity: 1;
    }

    &:disabled {
      cursor: not-allowed;
    }

    @include for-mouse {
      &:not(:disabled):hover {
        background: var(--color-action-side-background-hover);
      }

      &:not(:disabled):hover :global(.action-side-glyph) {
        opacity: 1;
      }
    }
  }
</style>
