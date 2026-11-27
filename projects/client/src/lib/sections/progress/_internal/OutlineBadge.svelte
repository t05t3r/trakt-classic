<script lang="ts">
  import type { OutlineBadgeProps } from './OutlineBadgeProps.ts';

  const { icon: Glyph, tone, children }: OutlineBadgeProps = $props();
</script>

<span class="trakt-outline-badge no-wrap" data-tone={tone}>
  {#if Glyph}
    <Glyph class="outline-badge-glyph" aria-hidden="true" />
  {/if}
  {@render children()}
</span>

<style lang="scss">
  .trakt-outline-badge {
    --outline-badge-color: var(--color-danger);

    display: inline-flex;
    flex: none;
    column-gap: var(--ni-4);
    align-items: center;
    padding-block: var(--ni-1);
    padding-inline: var(--ni-6);
    border: var(--ni-1) solid var(--outline-badge-color);
    border-radius: var(--border-radius-xxs);
    color: var(--color-text-primary);

    &[data-tone='watch'] {
      --outline-badge-color: var(--color-action-watch);
    }

    &[data-tone='neutral'] {
      --outline-badge-color: var(--color-border);
    }

    :global(.outline-badge-glyph) {
      width: var(--icon-size-menu-check);
      height: var(--icon-size-menu-check);
      color: var(--outline-badge-color);
    }
  }
</style>
