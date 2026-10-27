<script lang="ts">
  import PendingSpinner from '$lib/components/feedback/PendingSpinner.svelte';
  import IconCheck from '@tabler/icons-svelte/icons/check';
  import type { Snippet } from 'svelte';
  import type { MenuCheckState } from './_internal/MenuCheckState.ts';

  const {
    checked,
    children,
  }: { checked?: MenuCheckState; children: Snippet } = $props();
</script>

<span class="trakt-menu-row">
  <span class="menu-row-check" aria-hidden="true">
    {#if checked === true}
      <IconCheck class="menu-row-glyph" />
    {:else if checked === 'unknown'}
      <PendingSpinner />
    {/if}
  </span>
  {@render children()}
</span>

<style lang="scss">
  .trakt-menu-row {
    position: relative;
    display: block;
    min-height: var(--dropdown-row-height);
    padding-block: var(--ni-3);
    padding-inline: var(--ni-20);
    box-sizing: border-box;
    font-family: var(--font-family-body);
    font-size: var(--font-size-button);
    font-weight: var(--font-weight-body);
    line-height: var(--line-height-text);
    white-space: nowrap;

    .menu-row-check {
      // Tabler's default stroke, the one the check in this slot draws with.
      --pending-spinner-size: var(--icon-size-menu-check);
      --pending-spinner-stroke: 2;

      position: absolute;
      inset-block-start: var(--ni-4);
      inset-inline-start: var(--ni-4);
      display: flex;
    }

    :global(.menu-row-glyph) {
      width: var(--icon-size-menu-check);
      height: var(--icon-size-menu-check);
    }
  }
</style>
