import type CommunityRating from '$lib/components/badges/CommunityRating.svelte';
import type { QuickActionsTarget } from '$lib/features/media-actions/components/QuickActionsProps.ts';
import type { MediaCard } from '$lib/features/media-card/toMediaCard.ts';
import type { ComponentProps } from 'svelte';

export type CardCommunityRatingProps = {
  rating: MediaCard['rating'];
  target: QuickActionsTarget;
  // What `QuickActions` tells its `metadata`: undefined until known, then held through a refetch.
  hasPlay: boolean | undefined;
  variant?: ComponentProps<typeof CommunityRating>['variant'];
};
