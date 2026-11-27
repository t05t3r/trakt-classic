<script lang="ts">
  import PendingSpinner from '$lib/components/feedback/PendingSpinner.svelte';
  import IconCheck from '@tabler/icons-svelte/icons/check';
  import MenuGlyph from './MenuGlyph.svelte';
  import type { MenuRowProps } from './_internal/MenuRowProps.ts';

  const {
    checked,
    glyph,
    variant = 'dropdown',
    children,
  }: MenuRowProps = $props();
</script>

<span
  class="trakt-menu-row no-wrap"
  class:is-checked={checked === true}
  data-variant={variant}
>
  {#if glyph}
    <MenuGlyph>{@render glyph()}</MenuGlyph>
  {/if}
  <span class="menu-row-label">{@render children()}</span>
  <!-- A nav row marks the current page by its accent alone. -->
  {#if variant === 'dropdown'}
    <span class="menu-row-check" aria-hidden="true">
      {#if checked === true}
        <IconCheck class="menu-row-check-glyph" />
      {:else if checked === 'unknown'}
        <PendingSpinner />
      {/if}
    </span>
  {/if}
</span>

<style lang="scss">
  .trakt-menu-row {
    position: relative;
    display: flex;
    align-items: center;
    min-height: var(--dropdown-row-height);
    padding-block: var(--ni-2);
    // Starts where its trigger's content does, so the two columns line up.
    padding-inline-start: var(--dropdown-padding-inline);
    padding-inline-end: var(--ni-20);
    box-sizing: border-box;
    font-family: var(--font-family-body);
    font-size: var(--font-size-button);
    font-weight: var(--font-weight-body);
    line-height: var(--line-height-text);

    &.is-checked {
      color: var(--menu-row-checked-color, var(--color-accent));
    }

    &[data-variant='nav'] {
      min-height: var(--menu-row-height);
      padding-block: var(--ni-0);
      padding-inline: var(--menu-padding-inline);
      font-family: var(--font-family-heading);
      font-size: var(--font-size-text);
      font-weight: var(--font-weight-heading);
    }

    .menu-row-label {
      min-width: var(--ni-0);
    }

    // Spans the row's height, so the check centres on the label's line.
    .menu-row-check {
      // Tabler's default stroke, the one the check in this slot draws with.
      --pending-spinner-size: var(--icon-size-menu-check);
      --pending-spinner-stroke: 2;

      position: absolute;
      inset-block: var(--ni-0);
      inset-inline-end: var(--ni-4);
      display: flex;
      align-items: center;
    }

    :global(.menu-row-check-glyph) {
      width: var(--icon-size-menu-check);
      height: var(--icon-size-menu-check);
    }
  }
</style>
