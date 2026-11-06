<script lang="ts">
  import IconHeartFilled from '@tabler/icons-svelte/icons/heart-filled';

  const { rating, label }: { rating: number; label: string } = $props();
</script>

<span class="trakt-rating-line ellipsis" data-rating={rating}>
  <IconHeartFilled class="rating-line-heart" aria-hidden="true" />
  <b>{rating}</b> — {label}
</span>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-rating-line {
    @include clipped-inline-box;

    :global(.rating-line-heart) {
      width: var(--icon-size-rating-heart);
      height: var(--icon-size-rating-heart);
      vertical-align: middle;
    }

    @for $rating from 1 through 10 {
      &[data-rating='#{$rating}'] :global(.rating-line-heart) {
        color: var(--color-rating-#{$rating});
      }
    }
  }
</style>
