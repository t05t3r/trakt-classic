import type { MediaComment } from '$lib/requests/models/MediaComment.ts';
import type { Snippet } from 'svelte';

export type CommentCardProps = {
  comment: MediaComment;
  placement: 'block' | 'hub' | 'reply';
  airedEpisodes?: number | Nil;
  replyCount?: Snippet;
  // An id for the card's heading, so what belongs to the comment can point at it.
  headingId?: string;
  // Blurs the body as a spoiler's, whatever the comment's own flag says; its inline spoilers keep their own reveal.
  treatAsSpoiler?: boolean;
  // Shows a spoiler body revealed; the focus moves only off a focused reveal button, and inline spoilers keep their own reveal.
  revealSpoilers?: boolean;
};
