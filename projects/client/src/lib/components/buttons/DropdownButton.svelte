<script lang="ts">
  import IconChevronDown from '@tabler/icons-svelte/icons/chevron-down';
  import type { DropdownButtonProps } from './_internal/DropdownButtonProps.ts';

  const {
    label,
    selected = false,
    variant = 'default',
    font = 'body',
    children,
    ...rest
  }: DropdownButtonProps = $props();
</script>

<!-- After the spread, so a `Menu`'s untyped trigger props cannot override them. -->
<button
  {...rest}
  type="button"
  class="trakt-dropdown-button"
  class:is-selected={selected}
  data-variant={variant}
  data-font={font}
  aria-label={label}
>
  {@render children()}
  <IconChevronDown class="dropdown-button-caret" aria-hidden="true" />
</button>

<style lang="scss">
  .trakt-dropdown-button {
    display: inline-flex;
    align-items: center;
    padding: var(--ni-0);
    border: none;
    background: none;
    color: var(--color-text-primary);
    font-family: var(--font-family-body);
    font-size: var(--font-size-button);
    font-weight: var(--font-weight-body);
    line-height: var(--line-height-text);
    white-space: nowrap;
    cursor: pointer;
    transition: color var(--transition-default);

    &[data-font='heading'] {
      font-family: var(--font-family-heading);
    }

    &[data-variant='default'] {
      padding-block: var(--ni-6);
      padding-inline: var(--ni-12);
      border: var(--ni-1) solid var(--color-border-strong);
      border-radius: var(--border-radius-none);
      background: var(--color-surface-menu);
      color: var(--color-text-tertiary);
    }

    &.is-selected {
      color: var(--color-toggle-selected);
    }

    :global(.dropdown-button-caret) {
      flex-shrink: 0;
      width: var(--icon-size-dropdown-caret);
      height: var(--icon-size-dropdown-caret);
    }
  }
</style>
