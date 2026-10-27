<script lang="ts">
  import CardCommunityRating from '$lib/features/media-card/components/CardCommunityRating.svelte';
  import type { MediaCard } from '$lib/features/media-card/toMediaCard.ts';

  // Every rating under one signed-in user, so a spec compares them under the same settings.
  const { ratings }: { ratings: ReadonlyArray<MediaCard['rating']> } = $props();
</script>

{#each ratings as rating, index (index)}
  <CardCommunityRating {rating} />
{/each}
