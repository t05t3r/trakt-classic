<script lang="ts">
  const { rating, label }: { rating: number | Nil; label: string } = $props();
</script>

{#if rating != null}
  <div
    class="trakt-corner-rating"
    data-rating={rating}
    role="img"
    title={label}
    aria-label={label}
  >
    <span class="corner-rating-text tag" aria-hidden="true">{rating}</span>
  </div>
{/if}

<style lang="scss">
  .trakt-corner-rating {
    position: absolute;
    inset-block-start: var(--ni-0);
    inset-inline-end: var(--ni-0);
    z-index: var(--layer-raised);
    width: var(--ni-0);
    height: var(--ni-0);
    border-style: solid;
    border-color: transparent;
    border-width: var(--ni-0);
    border-inline-end-width: var(--corner-rating-size);
    border-block-end-width: var(--corner-rating-size);

    @for $rating from 1 through 10 {
      &[data-rating='#{$rating}'] {
        border-inline-end-color: var(--color-rating-#{$rating});
      }
    }

    .corner-rating-text {
      position: absolute;
      inset-block-start: var(--ni-0);
      inset-inline-end: var(--ni-neg-22);
      width: var(--ni-15);
      height: var(--corner-rating-size);
      color: var(--color-text-primary);
      font-family: var(--font-family-heading);
      font-weight: var(--font-weight-heading-heavy);
      line-height: var(--line-height-tag);
      text-align: center;
      transform: rotate(calc(var(--rtl-sign) * 45deg));
    }
  }
</style>
