<script lang="ts">
  import { clamp } from '$lib/utils/number/clamp.ts';
  import { ratio } from '$lib/utils/number/ratio.ts';
  import type { TickProgressBarProps } from './_internal/TickProgressBarProps.ts';

  const { value, total, size, label }: TickProgressBarProps = $props();

  const share = $derived(
    clamp({ value: ratio({ value, total }), min: 0, max: 1 }),
  );
</script>

<div
  class="trakt-tick-progress-bar"
  role="progressbar"
  aria-valuenow={Math.round(share * 100)}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label={label}
  data-size={size}
  style="--progress-share: {share}"
>
  <div class="progress-fill"></div>
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
      background: var(--color-progress-fill);
      transition: width var(--transition-default);
    }
  }
</style>
