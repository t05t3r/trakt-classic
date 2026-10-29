export type CommentRepliesProps = {
  // The comment replied to.
  id: number;
  // The id of the replied comment's heading, which describes the retry.
  describedBy?: string;
  treatAsSpoiler?: boolean;
  revealSpoilers?: boolean;
};
