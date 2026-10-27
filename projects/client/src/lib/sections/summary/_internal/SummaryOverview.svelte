<script lang="ts">
  import ClampedText from '$lib/components/text/ClampedText.svelte';
  import { OVERVIEW_PLACEHOLDER } from '$lib/requests/OVERVIEW_PLACEHOLDER.ts';
  import AdditionalStats from '$lib/sections/summary/AdditionalStats.svelte';
  import type { SummaryOverviewProps } from './SummaryOverviewProps.ts';
  import TrailerChip from './TrailerChip.svelte';

  const {
    rows = [],
    tagline,
    overview,
    trailer,
    actions,
  }: SummaryOverviewProps = $props();
</script>

<div class="trakt-summary-overview" data-layout="grid">
  <div class="overview-main" data-grid-column>
    <AdditionalStats {rows} />
    {#if tagline}
      <p class="overview-tagline">{tagline}</p>
    {/if}
    {#if overview && overview !== OVERVIEW_PLACEHOLDER}
      <div class="overview-text">
        <ClampedText>
          <p>{overview}</p>
        </ClampedText>
      </div>
    {/if}
    <TrailerChip {trailer} />
  </div>
  {#if actions}
    <div class="overview-actions" data-grid-column>{@render actions()}</div>
  {/if}
</div>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-summary-overview {
    .overview-main,
    .overview-actions {
      @include for-tablet-sm-and-below {
        grid-column: 1 / -1;
      }
    }

    .overview-main {
      @include for-tablet-lg {
        grid-column: span var(--summary-overview-column-span-tablet-lg);
      }

      @include for-desktop-lg {
        grid-column: span var(--summary-overview-column-span-desktop-lg);
      }
    }

    .overview-actions {
      @include for-tablet-sm-and-below {
        margin-block-start: var(--ni-10);
      }

      @include for-tablet-lg-and-above {
        margin-block-start: var(--ni-5);
      }

      @include for-tablet-lg {
        grid-column: span var(--summary-actions-column-span-tablet-lg);
      }

      @include for-desktop-lg {
        grid-column: span var(--summary-actions-column-span-desktop-lg);
      }
    }

    .overview-tagline {
      margin-block-end: var(--ni-10);
      font-family: var(--font-family-serif);
      font-style: italic;
    }

    .overview-text {
      --clamp-shade-color: var(--color-surface);

      margin-block-end: var(--ni-20);
      line-height: var(--line-height-text);
    }
  }
</style>
