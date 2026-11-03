<script lang="ts">
  import type { CountStatProps } from './CountStatProps.ts';

  const {
    icon: Glyph,
    value,
    label,
    size,
    underCount,
  }: CountStatProps = $props();
</script>

<span class="trakt-count-stat" title={label} data-size={size}>
  <Glyph class="count-stat-glyph" aria-hidden="true" />
  <span class="count-stat-value">
    {#if typeof value === 'string'}
      {value}
    {:else}
      {@render value()}
    {/if}
  </span>
  <span class="count-stat-label">{label}</span>
  {#if underCount}
    <span class="count-stat-under-count">{underCount}</span>
  {/if}
</span>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-count-stat {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: var(--ni-5);
    color: var(--color-count);
    font-family: var(--font-family-heading);
    font-size: var(--count-stat-font-size, var(--font-size-small));
    text-transform: uppercase;

    :global(.count-stat-glyph) {
      flex: none;
      width: var(--icon-size-count-stat);
      height: var(--icon-size-count-stat);
      stroke-width: var(--icon-stroke-chrome);
    }

    &[data-size='lg'] :global(.count-stat-glyph) {
      width: var(--icon-size-count-stat-lg);
      height: var(--icon-size-count-stat-lg);
    }

    .count-stat-label {
      @include visually-hidden;
    }

    .count-stat-under-count {
      position: absolute;
      inset-block-end: var(--under-count-offset);
      color: var(--color-under-count);
      font-size: var(--font-size-label);
      text-transform: none;
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      transition: opacity var(--transition-default);
    }

    @include for-mouse {
      &:hover .count-stat-under-count {
        opacity: 1;
        pointer-events: auto;
      }
    }
  }
</style>
