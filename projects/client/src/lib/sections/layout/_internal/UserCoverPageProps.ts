import type { UserNavKey } from '$lib/features/navigation/userNavItems.ts';
import type { ImageUrl } from '$lib/requests/models/ImageUrlSchema.ts';
import type { Snippet } from 'svelte';

export type UserCoverPageProps = {
  cover: ImageUrl | Nil;
  selected: UserNavKey;
  children: Snippet;
};
