<script lang="ts">
  import CornerRating from '$lib/components/badges/CornerRating.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import {
    type RatingStoreProps,
    useRating,
  } from '$lib/features/media-actions/stores/useRating.ts';

  const { target }: { target: RatingStoreProps } = $props();

  // Every caller keys the corner, by its card or a key block, so the target never changes.
  // svelte-ignore state_referenced_locally
  const { rating } = useRating(target);
</script>

{#if $rating != null}
  <CornerRating
    rating={$rating}
    label={m.label_your_rating({ rating: $rating })}
  />
{/if}
