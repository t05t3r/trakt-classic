<script lang="ts">
  import CommunityRating from '$lib/components/badges/CommunityRating.svelte';
  import { useDisplayEarlyRatings } from '$lib/features/auth/stores/useDisplayEarlyRatings.ts';
  import type { MediaCard } from '$lib/features/media-card/toMediaCard.ts';
  import type { ComponentProps } from 'svelte';

  const { rating, variant }: {
    rating: MediaCard['rating'];
    variant?: ComponentProps<typeof CommunityRating>['variant'];
  } = $props();

  const displayEarlyRatings = useDisplayEarlyRatings();
</script>

<CommunityRating
  rating={rating.value}
  earliestReleaseDate={rating.earliestReleaseDate}
  displayEarlyRatings={$displayEarlyRatings}
  {variant}
/>
