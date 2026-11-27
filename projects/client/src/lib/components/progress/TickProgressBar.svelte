<script lang="ts">
  import { clampedShare } from '$lib/utils/number/clampedShare.ts';
  import { flooredPercent } from '$lib/utils/number/flooredPercent.ts';
  import type { TickProgressBarProps } from './_internal/TickProgressBarProps.ts';
  import { toRuns } from './_internal/toRuns.ts';

  const { value, total, size, label, segments, highlight }:
    TickProgressBarProps = $props();

  const share = $derived(clampedShare({ value, total }));
  // Classic floors the share it announces: 10 of 18 reads 55.
  const percent = $derived(flooredPercent({ value, total }));
</script>

<div
  class="trakt-tick-progress-bar"
  role="progressbar"
  aria-valuenow={percent}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label={label}
  data-size={size}
  class:has-highlight={highlight}
  style="--progress-share: {share}"
>
  {#if segments}
    {#each toRuns(segments, highlight) as run (run.start)}
      <span
        class="progress-run"
        class:is-filled={run.isFilled}
        class:is-dimmed={run.isDimmed}
        style="--run-length: {run.length}"
      ></span>
    {/each}
  {:else}
    <div class="progress-fill"></div>
  {/if}
</div>

<style lang="scss">
  .trakt-tick-progress-bar {
    display: flex;
    height: var(--progress-height-sm);
    overflow: hidden;
    border-radius: var(--border-radius-none);
    background: var(--color-progress-track);

    &[data-size='lg'] {
      height: var(--progress-height-lg);
    }

    .progress-fill {
      width: calc(var(--progress-share) * 100%);
      transition: width var(--transition-default);
    }

    .progress-run {
      flex: var(--run-length);
    }

    // A dimmed empty run shows the page through its own track, not the bar's.
    &.has-highlight {
      background: none;

      .progress-run:not(.is-filled) {
        background: var(--color-progress-track);
      }
    }

    .progress-run.is-dimmed {
      opacity: var(--progress-dim-opacity);
    }

    .progress-fill,
    .progress-run.is-filled {
      background: var(--color-progress-fill);
    }
  }
</style>
