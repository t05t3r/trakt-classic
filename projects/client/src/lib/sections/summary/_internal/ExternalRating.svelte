<script lang="ts">
  import type { ExternalRatingItem } from './toExternalRatings.ts';

  const { rating }: { rating: ExternalRatingItem } = $props();
</script>

{#snippet content()}
  {#if rating.logo}
    <img class="external-rating-logo" src={rating.logo} alt={rating.label} />
  {:else}
    <span class="external-rating-source tag">{rating.label}</span>
  {/if}
  <span class="external-rating-number">
    <span class="external-rating-value">{rating.value}</span>
    {#if rating.caption}
      <span class="external-rating-caption tag">{rating.caption}</span>
    {/if}
    {#if rating.band}
      <span class="external-rating-metascore-bar"></span>
    {/if}
  </span>
{/snippet}

{#if rating.url}
  <a
    class="trakt-external-rating"
    data-band={rating.band}
    href={rating.url}
    target="_blank"
    rel="external noopener"
  >
    {@render content()}
  </a>
{:else}
  <span class="trakt-external-rating" data-band={rating.band}>
    {@render content()}
  </span>
{/if}

<style lang="scss">
  .trakt-external-rating {
    display: flex;
    align-items: flex-start;
    gap: var(--ni-7);
    color: var(--color-text-primary);
    line-height: var(--line-height-hero-rating);
    text-decoration: none;
    text-shadow: var(--text-shadow-on-image);

    .external-rating-source {
      display: flex;
      align-items: center;
      min-inline-size: var(--icon-size-hero-rating);
      block-size: var(--icon-size-hero-rating);
      color: var(--color-text-muted);
      font-family: var(--font-family-heading);
      font-weight: var(--font-weight-heading);
    }

    .external-rating-logo {
      flex-shrink: 0;
      block-size: var(--icon-size-hero-rating);
      inline-size: auto;
    }

    .external-rating-number {
      display: flex;
      flex-direction: column;
    }

    .external-rating-value {
      font-family: var(--font-family-heading);
      font-size: var(--font-size-hero-rating);
      font-weight: var(--font-weight-heading-heavy);
    }

    .external-rating-caption {
      color: var(--color-text-muted);
      font-family: var(--font-family-body);
      font-weight: var(--font-weight-body);
    }

    .external-rating-metascore-bar {
      block-size: var(--metascore-bar-height);
      margin-block-start: var(--ni-2);
    }

    @each $band in high, medium, low {
      &[data-band='#{$band}'] .external-rating-metascore-bar {
        background-color: var(--color-metascore-#{$band});
      }
    }
  }
</style>
