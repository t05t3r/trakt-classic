import type { ImageUrl } from '$lib/requests/models/ImageUrlSchema.ts';
import type { UserName } from '$lib/requests/models/UserName.ts';
import type { Snippet } from 'svelte';

export type UserCoverProps = {
  cover: ImageUrl | Nil;
  user: {
    username: string;
    name: UserName;
    avatar: { url: ImageUrl };
  } | Nil;
  isPrivate?: boolean;
  tabs: Snippet;
};
