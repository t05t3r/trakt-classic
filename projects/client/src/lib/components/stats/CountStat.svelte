<script lang="ts">
  import type { CountStatProps } from './CountStatProps.ts';

  const { icon: Glyph, value, label }: CountStatProps = $props();
</script>

<span class="trakt-count-stat" title={label}>
  <Glyph class="count-stat-glyph" aria-hidden="true" />
  <span class="count-stat-value">
    {#if typeof value === 'string'}
      {value}
    {:else}
      {@render value()}
    {/if}
  </span>
  <span class="count-stat-label">{label}</span>
</span>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-count-stat {
    display: inline-flex;
    align-items: center;
    gap: var(--ni-5);
    color: var(--color-count);
    font-family: var(--font-family-heading);
    font-size: var(--font-size-small);
    text-transform: uppercase;

    :global(.count-stat-glyph) {
      flex: none;
      width: var(--icon-size-count-stat);
      height: var(--icon-size-count-stat);
      stroke-width: var(--icon-stroke-chrome);
    }

    .count-stat-label {
      @include visually-hidden;
    }
  }
</style>
