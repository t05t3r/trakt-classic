import type { MediaComment } from '$lib/requests/models/MediaComment.ts';

export type CommentThreadProps = {
  comment: MediaComment;
  airedEpisodes?: number | Nil;
  treatAsSpoiler?: boolean;
  revealSpoilers?: boolean;
};
