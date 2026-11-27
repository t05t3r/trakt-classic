<script lang="ts">
  import { clampedShare } from '$lib/utils/number/clampedShare.ts';
  import type { SharePieProps } from './SharePieProps.ts';

  const { completed, total, class: className }: SharePieProps = $props();

  const percent = $derived(clampedShare({ value: completed, total }) * 100);
</script>

<!-- The sector is a stroke as wide as its circle, dashed to the share from the top. -->
<svg class={['trakt-share-pie', className]} viewBox="0 0 24 24" aria-hidden="true">
  <circle cx="12" cy="12" r="9" />
  <circle
    class="pie-share"
    cx="12"
    cy="12"
    r="4.5"
    stroke-width="9"
    pathLength="100"
    stroke-dasharray="{percent} 100"
    transform="rotate(-90 12 12)"
  />
</svg>

<style lang="scss">
  .trakt-share-pie {
    fill: none;
    stroke: currentColor;
    stroke-width: var(--icon-stroke-chrome);
  }
</style>
