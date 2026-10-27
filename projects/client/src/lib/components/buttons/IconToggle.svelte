<script lang="ts">
  import type { IconToggleProps } from './_internal/IconToggleProps.ts';

  const {
    label,
    pressed,
    onToggle,
    size = 'toolbar',
    children,
  }: IconToggleProps = $props();
</script>

<button
  type="button"
  class="trakt-icon-toggle"
  aria-label={label}
  aria-pressed={pressed}
  data-size={size}
  onclick={onToggle}
>
  {@render children()}
</button>

<style lang="scss">
  .trakt-icon-toggle {
    display: inline-flex;
    padding: var(--ni-0);
    border: none;
    background: none;
    color: var(--color-text-primary);
    cursor: pointer;
    transition: color var(--transition-default);

    &[aria-pressed='true'] {
      color: var(--color-toggle-selected);
    }

    :global(svg) {
      width: var(--icon-size-sort-direction);
      height: var(--icon-size-sort-direction);
      stroke-width: var(--icon-stroke-chrome);
    }

    &[data-size='heading'] :global(svg) {
      width: var(--icon-size-heading);
      height: var(--icon-size-heading);
    }
  }
</style>
