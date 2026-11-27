<script lang="ts" module>
  import { toFlooredPercentage } from '$lib/utils/formatting/number/toFlooredPercentage.ts';

  const WIDEST_PERCENTAGE = toFlooredPercentage({ value: 1, total: 1 });
</script>

<script lang="ts">
  import EpisodesWatchedBar from '$lib/components/progress/EpisodesWatchedBar.svelte';
  import type { PercentageBarProps } from './PercentageBarProps.ts';

  const { overlay, ...props }: PercentageBarProps = $props();

  const percentage = $derived(
    toFlooredPercentage({ value: props.completed, total: props.total }),
  );
</script>

<!-- The track takes what the percentage box leaves, so every bar of a size ends alike. -->
<div class="trakt-percentage-bar" data-size={props.size}>
  <div class="percentage-bar-track">
    <EpisodesWatchedBar {...props} />
    {#if overlay}
      <div class="percentage-bar-overlay">{@render overlay()}</div>
    {/if}
  </div>
  <span
    class="percentage-bar-value no-wrap"
    data-widest-percentage={WIDEST_PERCENTAGE}
  >
    <span class="percentage-bar-text">{percentage}</span>
  </span>
</div>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-percentage-bar {
    display: flex;
    column-gap: var(--ni-15);
    align-items: center;

    .percentage-bar-track {
      position: relative;
      flex: 1;
      min-width: var(--ni-0);
      padding-block: var(--ni-5);
    }

    &[data-size='lg'] .percentage-bar-track {
      padding-block: var(--ni-15);
    }

    .percentage-bar-overlay {
      position: absolute;
      inset: var(--ni-0);
    }

    .percentage-bar-value {
      display: grid;
      flex: none;
      font-family: var(--font-family-heading);
      font-weight: var(--font-weight-heading);

      // An unseen copy of the widest value, sharing the text's cell, sets the box's width.
      &::before {
        content: attr(data-widest-percentage);
        visibility: hidden;
      }

      &::before,
      .percentage-bar-text {
        grid-area: 1 / 1;
      }
    }

    &[data-size='lg'] .percentage-bar-value {
      font-size: var(--font-size-progress-percentage);
    }

    @include for-tablet-sm {
      @media (orientation: portrait) {
        column-gap: var(--ni-13);
      }
    }

    @include for-mobile {
      column-gap: var(--ni-5);
    }
  }
</style>
