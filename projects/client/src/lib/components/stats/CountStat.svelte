<script lang="ts">
  import { hint } from '$lib/components/tooltip/hint.svelte.ts';
  import type { CountStatProps } from './CountStatProps.ts';

  const {
    icon: Glyph,
    glyph,
    value,
    label,
    size,
    underCount,
    wideLabel = false,
    variant,
    hint: ownHint,
  }: CountStatProps = $props();

  const tooltip = $derived(ownHint ?? (variant === 'row' ? undefined : label));
</script>

<span
  class="trakt-count-stat"
  data-size={size}
  data-label={wideLabel ? 'wide' : undefined}
  data-variant={variant}
  {@attach hint(() =>
    tooltip === undefined ? undefined : { content: tooltip, detail: underCount }
  )}
>
  {#if glyph}
    {@render glyph('count-stat-glyph')}
  {:else if Glyph}
    <Glyph class="count-stat-glyph" aria-hidden="true" />
  {/if}
  <span class="count-stat-value">
    {#if typeof value === 'string'}
      {value}
    {:else}
      {@render value()}
    {/if}
  </span>
  <span class="count-stat-label">{label}</span>
  <!-- The tooltip shows it; read here too, since the stat takes no focus. -->
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
    gap: var(--count-stat-gap, var(--ni-5));
    color: var(--color-count);
    font-family: var(--font-family-heading);
    font-size: var(--count-stat-font-size, var(--font-size-small));
    text-transform: uppercase;

    :global(.count-stat-glyph) {
      flex: none;
      width: var(--count-stat-glyph-size, var(--icon-size-count-stat));
      height: var(--count-stat-glyph-size, var(--icon-size-count-stat));
      stroke-width: var(--icon-stroke-chrome);
    }

    &[data-size='lg'] :global(.count-stat-glyph) {
      width: var(--count-stat-glyph-size, var(--icon-size-count-stat-lg));
      height: var(--count-stat-glyph-size, var(--icon-size-count-stat-lg));
    }

    &:not([data-label='wide'], [data-variant='row']) .count-stat-label {
      @include visually-hidden;
    }

    .count-stat-under-count {
      @include visually-hidden;
    }

    &[data-variant='row'] {
      color: var(--color-text-primary);
      text-transform: none;

      :global(.count-stat-glyph) {
        color: var(--count-stat-glyph-color, var(--color-count));
      }

      .count-stat-value {
        @include heavy-heading-font;
      }

      .count-stat-label {
        color: var(--color-text-muted);
        font-family: var(--font-family-body);
      }
    }

    @include for-tablet-sm-and-below {
      &:not([data-variant='row']) .count-stat-label {
        @include visually-hidden;
      }
    }
  }
</style>
