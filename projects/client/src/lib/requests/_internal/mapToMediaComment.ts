import type { MediaComment } from '../models/MediaComment.ts';
import type { CommentResponse } from '@trakt/api';
import { mapToUserProfile } from './mapToUserProfile.ts';

export function mapToMediaComment(
  commentResponse: CommentResponse,
): MediaComment {
  return {
    id: commentResponse.id,
    key: `comment-${commentResponse.id}`,
    parentId: commentResponse.parent_id,
    createdAt: new Date(commentResponse.created_at),
    updatedAt: new Date(commentResponse.updated_at),
    comment: commentResponse.comment,
    gif: commentResponse.gif?.url ?? null,
    isSpoiler: commentResponse.spoiler,
    isReview: commentResponse.review,
    replyCount: commentResponse.replies,
    likeCount: commentResponse.likes,
    user: {
      ...mapToUserProfile(commentResponse.user),
      stats: {
        rating: commentResponse.user_stats.rating,
        playCount: commentResponse.user_stats.play_count,
        completedCount: commentResponse.user_stats.completed_count,
      },
    },
  };
}
